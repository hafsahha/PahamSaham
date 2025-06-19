"""
Transform module for yfinance data
This module is responsible for cleaning and transforming yfinance data by keeping only essential fields from the 'info' object
"""

import json
import os
import logging
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
INPUT_FILE_PATH = os.environ.get('INPUT_PATH')
OUTPUT_FILE_PATH = os.environ.get('OUTPUT_PATH')

# Essential fields from info object that are used by backend API
ESSENTIAL_INFO_FIELDS = [
    'symbol',          # Used for stock identification and queries
    'shortName',       # Used for display in market overview
    'longName',        # Used for company name display
    'sector',          # Used for sector classification and filtering
]

def clean_info_object(info_data):
    """
    Clean the info object by keeping only essential fields used by the backend
    
    Args:
        info_data (dict): Original info object from yfinance
        
    Returns:
        dict: Cleaned info object with only essential fields
    """
    if not info_data or not isinstance(info_data, dict):
        return {}
    
    cleaned_info = {}
    
    # Extract only essential fields
    for field in ESSENTIAL_INFO_FIELDS:
        if field in info_data:
            value = info_data[field]
            # Only include non-empty values
            if value is not None and value != "" and value != "N/A":
                cleaned_info[field] = value
    
    return cleaned_info

def transform_yfinance_data(input_file_path=INPUT_FILE_PATH, output_file_path=OUTPUT_FILE_PATH):
    """
    Transform yfinance data by cleaning the info object to keep only essential fields
    
    Args:
        input_file_path (str): Path to input JSON file
        output_file_path (str): Path to output JSON file
        
    Returns:
        dict: Summary of transformation process
    """
    start_time = time.time()
    logger.info(f"Starting yfinance data transformation at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Validate environment variables
    if not input_file_path:
        error_message = "INPUT_PATH environment variable is not set"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    if not output_file_path:
        error_message = "OUTPUT_PATH environment variable is not set"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    logger.info(f"Input file: {input_file_path}")
    logger.info(f"Output file: {output_file_path}")
    
    # Check if input file exists
    if not os.path.exists(input_file_path):
        error_message = f"Input file not found: {input_file_path}"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    # Load input data
    try:
        with open(input_file_path, 'r', encoding='utf-8') as f:
            stock_data_list = json.load(f)
        logger.info(f"✅ Loaded {len(stock_data_list)} stock records from input file")
    except Exception as e:
        error_message = f"Failed to read input file: {str(e)}"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    # Transform data
    transformed_data = []
    success_count = 0
    error_count = 0
    total_info_fields_before = 0
    total_info_fields_after = 0
    
    for idx, stock_doc in enumerate(stock_data_list, 1):
        try:
            symbol = stock_doc.get('symbol', f'stock_{idx}')
            logger.info(f"🔄 Processing stock: {symbol} ({idx}/{len(stock_data_list)})")
            
            # Create a copy of the document
            transformed_doc = stock_doc.copy()
            
            # Get original info object
            original_info = stock_doc.get('info', {})
            original_field_count = len(original_info)
            total_info_fields_before += original_field_count
            
            # Clean the info object
            cleaned_info = clean_info_object(original_info)
            cleaned_field_count = len(cleaned_info)
            total_info_fields_after += cleaned_field_count
            
            # Replace the info object with cleaned version
            transformed_doc['info'] = cleaned_info
            
            # Add transformation metadata
            transformed_doc['transform_date'] = datetime.now().strftime('%Y-%m-%d')
            transformed_doc['transform_info'] = {
                'original_info_fields': original_field_count,
                'cleaned_info_fields': cleaned_field_count,
                'fields_removed': original_field_count - cleaned_field_count
            }
            
            transformed_data.append(transformed_doc)
            success_count += 1
            
            logger.info(f"✅ Stock {symbol}: Cleaned info object from {original_field_count} to {cleaned_field_count} fields ({original_field_count - cleaned_field_count} fields removed)")
            
        except Exception as e:
            error_count += 1
            logger.error(f"❌ Error processing stock {idx}: {str(e)}")
            # Include original document even if transformation failed
            transformed_data.append(stock_doc)
    
    # Save transformed data
    try:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(transformed_data, f, ensure_ascii=False, indent=4)
        logger.info(f"✅ Transformed data saved to {output_file_path}")
    except Exception as e:
        error_message = f"Failed to save transformed data: {str(e)}"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    # Calculate transformation statistics
    elapsed_time = time.time() - start_time
    avg_fields_before = total_info_fields_before / len(stock_data_list) if stock_data_list else 0
    avg_fields_after = total_info_fields_after / len(stock_data_list) if stock_data_list else 0
    total_fields_removed = total_info_fields_before - total_info_fields_after
    
    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("YFINANCE DATA TRANSFORMATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"⏱️ Execution time: {elapsed_time:.2f} seconds")
    logger.info(f"📊 Total stocks processed: {len(stock_data_list)}")
    logger.info(f"✅ Successfully transformed: {success_count}")
    logger.info(f"❌ Transformation errors: {error_count}")
    logger.info(f"📈 Total info fields before: {total_info_fields_before}")
    logger.info(f"📉 Total info fields after: {total_info_fields_after}")
    logger.info(f"🗑️ Total fields removed: {total_fields_removed}")
    logger.info(f"📊 Average fields per stock before: {avg_fields_before:.1f}")
    logger.info(f"📊 Average fields per stock after: {avg_fields_after:.1f}")
    logger.info(f"💾 Data size reduction: {((total_fields_removed / total_info_fields_before) * 100):.1f}%")
    
    logger.info("\nESSENTIAL FIELDS KEPT:")
    for field in ESSENTIAL_INFO_FIELDS:
        logger.info(f"  - {field}")
    
    if error_count == 0:
        logger.info("✅ SUCCESS: All records transformed successfully!")
    elif error_count < len(stock_data_list):
        logger.info(f"⚠️ PARTIAL SUCCESS: {success_count} of {len(stock_data_list)} records transformed successfully")
    else:
        logger.info("❌ FAILURE: No records transformed successfully")
    
    return {
        "status": "success" if error_count == 0 else "partial_success" if error_count < len(stock_data_list) else "failure",
        "total_processed": len(stock_data_list),
        "successfully_transformed": success_count,
        "errors": error_count,
        "execution_time_seconds": elapsed_time,
        "fields_removed": total_fields_removed,
        "data_size_reduction_percent": round(((total_fields_removed / total_info_fields_before) * 100), 1) if total_info_fields_before > 0 else 0,
        "avg_fields_before": round(avg_fields_before, 1),
        "avg_fields_after": round(avg_fields_after, 1)
    }

if __name__ == "__main__":
    # Can be run as a standalone script for testing
    logger.info("Starting yfinance transform script...")
    try:
        result = transform_yfinance_data()
        logger.info(f"Transform completed with result: {result}")
    except Exception as e:
        logger.error(f"Fatal error in transform script: {str(e)}")
        import traceback
        traceback.print_exc()
