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
DEFAULT_COLLECTION = os.environ.get('MONGO_COLLECTION')
INPUT_FILE_PATH = os.environ.get('INPUT_PATH')

def load_yfinance_to_mongodb(input_file_path=INPUT_FILE_PATH, mongo_collection=DEFAULT_COLLECTION):
    """
    Load yFinance data to MongoDB. Append new history data only if it's new.
    """
    start_time = time.time()

    logger.info(f"Start MongoDB yFinance load at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Loading from: {input_file_path}")
    logger.info(f"Target MongoDB: {MONGO_DB}.{mongo_collection}")

    # Load JSON data
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
        client.server_info()
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
            if "_id" in doc:
                del doc["_id"]
                
            symbol = doc.get("info", {}).get("symbol")

            if not symbol:
                logger.warning(f"Document {idx} has no symbol, skipping")
                error_count += 1
                continue

            doc["symbol"] = symbol
            doc["update_date"] = datetime.now().strftime('%Y-%m-%d')

            existing = collection.find_one({"info.symbol": symbol})

            if existing:
                new_history = doc.get("history", [])
                if new_history:
                    existing_dates = set(entry.get("Date") for entry in existing.get("history", []))
                    added_entries = [entry for entry in new_history if entry.get("Date") not in existing_dates]

                    if added_entries:
                        update_fields = {k: v for k, v in doc.items() if k != "history"}

                        result = collection.update_one(
                            {"_id": existing["_id"]},
                            {
                                "$push": {"history": {"$each": added_entries}},
                                "$set": update_fields
                            }
                        )

                        history_update_count += 1
                        if result.modified_count > 0:
                            update_count += 1
                        logger.debug(f"Appended {len(added_entries)} new history entries for {symbol}")
                    else:
                        logger.debug(f"No new history to append for {symbol}")
                else:
                    logger.debug(f"No history data found in new document for {symbol}")
            else:
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