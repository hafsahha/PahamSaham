import shutil
import os
import json
from pyspark.sql import SparkSession

# Initialize Spark session
spark = SparkSession.builder \
    .appName("Transform XBRL Data") \
    .getOrCreate()

# Define the function to extract financials from the XBRL data
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
            if 'entity' in context and 'identifier' in context['entity']:
                result["EntityCode"] = context['entity']['identifier'].get('#text', None)
            
            # Handle EntityName using the idx-dei:EntityName from the context
            if 'entity' in context and 'identifier' in context['entity']:
                # Check if idx-dei:EntityName exists and retrieve its value
                entity_name = context['entity'].get('idx-dei:EntityName', None)
                if isinstance(entity_name, dict) and '#text' in entity_name:
                    result["EntityName"] = entity_name['#text']
                elif isinstance(entity_name, str):
                    result["EntityName"] = entity_name

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

    return result

# Path to the extracted folder where XBRL files are stored
extracted_folder = '/app/extract/idx_extracted'  # Update with the correct path for Docker

all_data = []

# Process each extracted XBRL file
for company in os.listdir(extracted_folder):
    company_path = os.path.join(extracted_folder, company)

    if os.path.isdir(company_path):
        for file in os.listdir(company_path):
            if file.endswith(".xbrl"):  # Process only .xbrl files
                xbrl_file_path = os.path.join(company_path, file)

                try:
                    # Read and parse the XBRL file
                    with open(xbrl_file_path, 'rb') as xbrl_file:
                        xbrl_content = xbrl_file.read()
                        xbrl_dict = xmltodict.parse(xbrl_content)

                    # Extract financial data using the function
                    financial_data = extract_financials(xbrl_dict)

                    # Add company name and file name to the results
                    financial_data['company'] = company
                    financial_data['filename'] = file

                    all_data.append(financial_data)  # Store extracted data

                    print(f"Processed {file} for {company}")

                except Exception as e:
                    print(f"Error processing {file} for {company}: {e}")

# Create Spark DataFrame from all extracted data
spark_df = spark.createDataFrame(all_data)

# Show Spark DataFrame (optional for debugging)
spark_df.show(truncate=False)

# Save to JSON file using Spark
json_output_file = '/app/output/combined_data.json'
spark_df.write.json(json_output_file, mode='overwrite')

print(f"All data extracted and saved to {json_output_file}")

# Function to clean up and remove idx_extracted folder after processing
def cleanup_extracted_folder():
    """Remove extracted folder after processing"""
    try:
        if os.path.exists(extracted_folder):
            shutil.rmtree(extracted_folder)  # Remove idx_extracted folder
            print(f"Cleaned up folder: {extracted_folder}")
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")

# Call cleanup after the transformation process
cleanup_extracted_folder()
