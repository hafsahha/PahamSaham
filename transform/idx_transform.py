from pyspark.sql import SparkSession
from pyspark import RDD
import xmltodict
import json
import os
import shutil

# Initialize Spark session
spark = SparkSession.builder \
    .appName("XBRL Financial Data Extraction") \
    .getOrCreate()

# Function to extract financials using the correct context
def extract_financials(xbrl_dict):
    tags = {
        "Revenue": ["idx-cor:SalesAndRevenue"],
        "GrossProfit": ["idx-cor:GrossProfit"],
        "OperatingProfit": ["idx-cor:ProfitLossFromContinuingOperations", "idx-cor:ProfitLoss"],
        "NetProfit": ["idx-cor:ProfitLoss", "idx-cor:ProfitLossAttributableToParentEntity"],
        "Cash": ["idx-cor:CashAndCashEquivalents"],
        "TotalAssets": ["idx-cor:Assets"],
        "ShortTermBorrowing": ["idx-cor:ShortTermBankLoans", "idx-cor:ShortTermLoans"],
        "LongTermBorrowing": ["idx-cor:LongTermBankLoans", "idx-cor:LongTermLoans"],
        "TotalEquity": ["idx-cor:Equity", "idx-cor:EquityAttributableToEquityOwnersOfParentEntity"],
        "CashFromOperating": ["idx-cor:NetCashFlowsReceivedFromUsedInOperatingActivities", "idx-cor:CashGeneratedFromUsedInOperations"],
        "CashFromInvesting": ["idx-cor:NetCashFlowsReceivedFromUsedInInvestingActivities"],
        "CashFromFinancing": ["idx-cor:NetCashFlowsReceivedFromUsedInFinancingActivities"]
    }

    result = {}

    # Extract financial data based on the defined tags
    for key, possible_tags in tags.items():
        value = None
        for tag in possible_tags:
            if isinstance(xbrl_dict.get('xbrl', {}), dict) and tag in xbrl_dict['xbrl']:
                data = xbrl_dict['xbrl'][tag]
                # If the data is a list, take the first element
                if isinstance(data, list):
                    data = data[0]
                # Get the text value if available
                if isinstance(data, dict) and '#text' in data:
                    value = data['#text']
                elif isinstance(data, str):
                    value = data
                break  # Once found, break the loop for this tag

        # Store the extracted value
        result[key] = value

    # Now let's handle the 'context' for EntityCode, EntityName, and EndDate
    context_data = xbrl_dict.get('xbrl', {}).get('context', [])

    if isinstance(context_data, list):
        for context in context_data:
            if 'period' in context:
                # First check for the "instant" key in the period for "instant" values
                if 'instant' in context['period']:
                    # We need to select the "CurrentYearInstant" context for the correct EndDate
                    if context['@id'] == 'CurrentYearInstant':
                        result["EndDate"] = context['period']['instant']
                # Check for the "startDate" and "endDate" for "duration" values
                elif 'startDate' in context['period'] and 'endDate' in context['period']:
                    # Select the correct duration context for the correct EndDate
                    if context['@id'] == 'CurrentYearDuration':
                        result["EndDate"] = context['period']['endDate']

    # Handle the case where EntityName is outside the context and is in idx-dei:EntityName
    entity_name_outside_context = xbrl_dict.get('xbrl', {}).get('idx-dei:EntityName', None)
    if entity_name_outside_context:
        # If idx-dei:EntityName is found, extract the name
        if isinstance(entity_name_outside_context, dict) and '#text' in entity_name_outside_context:
            result["EntityName"] = entity_name_outside_context['#text']

    # New code: Extracting EntityCode directly from idx-dei:EntityCode
    entity_code_outside_context = xbrl_dict.get('xbrl', {}).get('idx-dei:EntityCode', None)
    if entity_code_outside_context:
        # If idx-dei:EntityCode is found, extract the code
        if isinstance(entity_code_outside_context, dict) and '#text' in entity_code_outside_context:
            result["EntityCode"] = entity_code_outside_context['#text']

    return result

# Path to the extracted folder where the XBRL files are stored
extracted_folder = os.environ.get('INPUT_PATH')

# Get all files from the extracted folder
xbrl_files = []
for company in os.listdir(extracted_folder):
    company_path = os.path.join(extracted_folder, company)

    if os.path.isdir(company_path):
        for file in os.listdir(company_path):
            if file.endswith(".xbrl"):  # Process only .xbrl files
                xbrl_files.append(os.path.join(company_path, file))

# Convert the list of XBRL files into an RDD
rdd = spark.sparkContext.parallelize(xbrl_files)

# Function to process each XBRL file
def process_xbrl_file(file_path):
    try:
        with open(file_path, 'rb') as xbrl_file:
            xbrl_content = xbrl_file.read()
            xbrl_dict = xmltodict.parse(xbrl_content)

        # Extract financial data
        financial_data = extract_financials(xbrl_dict)
        financial_data['filename'] = file_path  # Add the filename for reference

        return financial_data
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

# Process the XBRL files in parallel
processed_data = rdd.map(process_xbrl_file).filter(lambda x: x is not None).collect()

# Save the results to a JSON file
json_output_file = os.environ.get('OUTPUT_PATH')
with open(json_output_file, 'w', encoding='utf-8') as json_file:
    json.dump(processed_data, json_file, indent=4, ensure_ascii=False)

print(f"All data extracted and saved to {json_output_file}")

# Stop the Spark session
spark.stop()

# Function to delete all files and subdirectories but keep the folder
def clear_folder(folder_path):
    try:
        # Iterate over all files and subdirectories in the folder
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            
            # If it's a directory, delete it recursively
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
            else:
                # If it's a file, delete it
                os.remove(file_path)
        print(f"Folder {folder_path} has been cleared.")
    except Exception as e:
        print(f"Error clearing folder {folder_path}: {e}")

clear_folder("/app/output/idx_zip")
clear_folder("/app/output/idx_extracted")

print("Folders cleared but folder structure remains.")
