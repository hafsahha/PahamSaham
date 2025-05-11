import os
import json
import xmltodict
import shutil

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

    # Handle the case where EntityName is outside the context and is in idx-dei:EntityName
    entity_name_outside_context = xbrl_dict.get('xbrl', {}).get('idx-dei:EntityName', None)
    if entity_name_outside_context:
        # If idx-dei:EntityName is found, extract the name
        if isinstance(entity_name_outside_context, dict) and '#text' in entity_name_outside_context:
            result["EntityName"] = entity_name_outside_context['#text']

    return result

# Path to the extracted folder where the XBRL files are stored
extracted_folder = "/app/output/idx_extracted"  # Folder where ZIP files were extracted to

# Process each extracted XBRL file
all_data = []

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

# Save all extracted financial data to a JSON file
json_output_file = "/app/output/combined_data.json"

with open(json_output_file, 'w', encoding='utf-8') as json_file:
    json.dump(all_data, json_file, indent=4, ensure_ascii=False)

print(f"All data extracted and saved to {json_output_file}")
