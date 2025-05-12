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

# MongoDB connection details via env (default fallback)
MONGO_URI = os.environ.get('MONGO_URI')
MONGO_DB = os.environ.get('MONGO_DB')
DEFAULT_COLLECTION = os.environ.get('MONGO_COLLECTION', 'stock_data')
INPUT_FILE_PATH = os.environ.get('YFINANCE_OUTPUT_PATH')

def load_yfinance_to_mongodb(input_file_path=INPUT_FILE_PATH, mongo_collection=DEFAULT_COLLECTION):
    """
    Specialized loader for yFinance data that appends new history records to existing documents.
    """
    start_time = time.time()

    logger.info(f"Start MongoDB yFinance load at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Loading from: {input_file_path}")
    logger.info(f"Target MongoDB: {MONGO_DB}.{mongo_collection}")

    # Load the JSON data
    try:
        with open(input_file_path, 'r', encoding='utf-8') as f:
            data_list = json.load(f)
        logger.info(f"Loaded {len(data_list)} stock records from file")
    except Exception as e:
        logger.error(f"Failed to read input file {input_file_path}: {str(e)}")
        raise

    # Connect to MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()  # Test connection
        db = client[MONGO_DB]
        collection = db[mongo_collection]
        logger.info("MongoDB connection successful")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        raise

    insert_count = 0
    update_count = 0
    history_update_count = 0
    error_count = 0

    for idx, doc in enumerate(data_list, 1):
        try:
            # Get the stock symbol (used as _id)
            symbol = doc.get("symbol")
            
            if not symbol:
                logger.warning(f"Document {idx} has no symbol, skipping")
                error_count += 1
                continue
            
            # Ensure the document has all required fields
            doc["_id"] = symbol
            doc["update_date"] = datetime.now().strftime('%Y-%m-%d')
            
            # Check if the document already exists
            existing = collection.find_one({"_id": symbol})
            
            if existing:
                # Document exists - Need to process history differently
                new_history = doc.get("history", [])
                
                if new_history:
                    # Get the dates from the new history entries
                    new_dates = set(entry.get("Date") for entry in new_history)
                    
                    if "history" not in existing:
                        # No history in existing document, add all new history
                        existing["history"] = new_history
                    else:
                        # Merge histories - first create a dictionary of existing history by date
                        existing_history_dict = {entry.get("Date"): entry for entry in existing["history"]}
                        
                        # Add new entries that don't already exist
                        for new_entry in new_history:
                            date = new_entry.get("Date")
                            if date not in existing_history_dict:
                                existing["history"].append(new_entry)
                    
                    # Update other fields except history
                    for key, value in doc.items():
                        if key != "history":
                            existing[key] = value
                    
                    # Update the document with the merged history
                    result = collection.replace_one({"_id": symbol}, existing)
                    history_update_count += 1
                    if result.modified_count > 0:
                        update_count += 1
                else:
                    # No new history to add, just update the remaining fields
                    result = collection.replace_one({"_id": symbol}, doc)
                    update_count += int(result.modified_count > 0)
            else:
                # New document - insert as is
                collection.insert_one(doc)
                insert_count += 1

            if idx % 10 == 0 or idx == len(data_list):
                logger.info(f"Progress: {idx}/{len(data_list)} documents processed")

        except Exception as e:
            error_count += 1
            logger.error(f"Error processing document {idx} (symbol: {symbol if 'symbol' in locals() else 'unknown'}): {str(e)}")

    elapsed = time.time() - start_time

    logger.info("\n" + "=" * 50)
    logger.info("YFINANCE MONGODB LOAD SUMMARY")
    logger.info("=" * 50)
    logger.info(f"Execution time: {elapsed:.2f} seconds")
    logger.info(f"Total documents processed: {len(data_list)}")
    logger.info(f"New documents inserted: {insert_count}")
    logger.info(f"Existing documents updated: {update_count}")
    logger.info(f"Documents with history appended: {history_update_count}")
    logger.info(f"Errors: {error_count}")

    client.close()
    logger.info("MongoDB connection closed")

    return {
        "status": "success" if error_count == 0 else "partial_success" if error_count < len(data_list) else "failure",
        "total_processed": len(data_list),
        "inserted": insert_count,
        "updated": update_count, 
        "history_updated": history_update_count,
        "errors": error_count,
        "execution_time_seconds": elapsed
    }

if __name__ == "__main__":
    load_yfinance_to_mongodb()