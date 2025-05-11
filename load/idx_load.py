"""
MongoDB load module for IDX data
This module is responsible for loading the extracted IDX data into MongoDB
"""

import json
import os
import logging
import time
from datetime import datetime
from pymongo import MongoClient, errors

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection details
MONGO_URI = os.environ.get('MONGO_URI')
MONGO_DB = os.environ.get('MONGO_DB')
MONGO_COLLECTION = "idx_data"  # Collection name for idx data

# Input file path (can be configured via environment variable)
INPUT_FILE_PATH = os.environ.get('IDX_INPUT_PATH', 'output/idx_output.json')  # Default path for IDX JSON data

def load_to_mongodb(input_file_path=INPUT_FILE_PATH):
    """
    Load the IDX data from JSON file into MongoDB
    """
    start_time = time.time()
    
    logger.info(f"Starting MongoDB load process at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Loading data from: {input_file_path}")
    logger.info(f"Target MongoDB: {MONGO_DB}.{MONGO_COLLECTION}")
    
    # Load the JSON data
    try:
        with open(input_file_path, 'r', encoding='utf-8') as json_file:
            idx_list = json.load(json_file)
        logger.info(f"Successfully loaded {len(idx_list)} records from file")
    except Exception as e:
        logger.error(f"Failed to read input file {input_file_path}: {str(e)}")
        raise
    
    # Connect to MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.server_info()
        db = client[MONGO_DB]
        collection = db[MONGO_COLLECTION]
        logger.info("Successfully connected to MongoDB")
    except errors.ServerSelectionTimeoutError as e:
        logger.error(f"MongoDB Connection Error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error when connecting to MongoDB: {str(e)}")
        raise
    
    # Load data into MongoDB
    insert_count = 0
    update_count = 0
    error_count = 0
    
    for idx, idx_doc in enumerate(idx_list, 1):
        try:
            # Check if document exists
            idx_id = idx_doc.get("_id")
            existing_doc = collection.find_one({"_id": idx_id})
            
            if existing_doc:
                # Update existing document
                result = collection.replace_one({"_id": idx_id}, idx_doc)
                if result.modified_count:
                    update_count += 1
                    logger.debug(f"Updated document for {idx_id}")
                else:
                    logger.debug(f"No changes for {idx_id}")
            else:
                # Insert new document
                collection.insert_one(idx_doc)
                insert_count += 1
                logger.debug(f"Inserted new document for {idx_id}")
            
            # Log progress for every 10 records
            if idx % 10 == 0 or idx == len(idx_list):
                logger.info(f"Progress: {idx}/{len(idx_list)} records processed")
                
        except Exception as e:
            error_count += 1
            idx_id = idx_doc.get("_id", "unknown")
            logger.error(f"Error processing record {idx_id}: {str(e)}")
    
    # Calculate total time
    total_elapsed_time = time.time() - start_time
    
    # Log summary
    logger.info("\n" + "=" * 50)
    logger.info(f"MONGODB LOAD SUMMARY")
    logger.info("=" * 50)
    logger.info(f"Total execution time: {total_elapsed_time:.2f} seconds")
    logger.info(f"Total records processed: {len(idx_list)}")
    logger.info(f"New documents inserted: {insert_count}")
    logger.info(f"Existing documents updated: {update_count}")
    logger.info(f"Errors encountered: {error_count}")
    
    # Close the MongoDB connection
    client.close()
    logger.info("MongoDB connection closed")
    
    # Create summary dict for Airflow XCom or further processing
    summary = {
        "status": "success" if error_count == 0 else "partial_success" if error_count < len(idx_list) else "failure",
        "total_processed": len(idx_list),
        "inserted": insert_count,
        "updated": update_count,
        "errors": error_count,
        "execution_time_seconds": total_elapsed_time
    }
    
    return summary

if __name__ == "__main__":
    # Can be run as a standalone script for testing
    load_to_mongodb()
