import json
import os
import logging
import time
import sys
from datetime import datetime
from pymongo import MongoClient, errors
 
# Add immediate debug output to make sure script starts
print("STARTING YFINANCE LOADER SCRIPT", flush=True)
sys.stdout.flush()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection details via env
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
    
    # Check if all required environment variables are set
    if not MONGO_URI:
        error_message = "MONGO_URI environment variable is not set"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    if not MONGO_DB:
        error_message = "MONGO_DB environment variable is not set"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    if not mongo_collection:
        error_message = "MONGO_COLLECTION environment variable is not set"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }
    
    if not input_file_path:
        error_message = "INPUT_PATH environment variable is not set"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure", 
            "error": error_message
        }
    
    logger.info(f"MongoDB URI: {MONGO_URI}")
    logger.info(f"MongoDB Database: {MONGO_DB}")
    logger.info(f"Loading from: {input_file_path}")
    logger.info(f"Target MongoDB: {MONGO_DB}.{mongo_collection}")
    
    # Check if file exists
    if not os.path.exists(input_file_path):
        error_message = f"Input file not found: {input_file_path}"
        logger.error(f"❌ {error_message}")
        return {
            "status": "failure",
            "error": error_message
        }

    # Load JSON data
    try:
        with open(input_file_path, 'r', encoding='utf-8') as f:
            data_list = json.load(f)
        logger.info(f"Loaded {len(data_list)} stock records from file")
    except Exception as e:
        logger.error(f"Failed to read input file {input_file_path}: {str(e)}")
        raise    # Connect to MongoDB
    try:
        logger.info(f"Connecting to MongoDB at {MONGO_URI}")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)  # 10 second timeout
        # Explicitly ping the server to validate connection
        client.admin.command('ping')
        db = client[MONGO_DB]
        collection = db[mongo_collection]
        logger.info(f"✅ MongoDB connection successful to {MONGO_DB}.{mongo_collection}")
    except errors.ServerSelectionTimeoutError as e:
        error_message = f"MongoDB connection timed out: {str(e)}"
        logger.error(f"❌ {error_message}")
        logger.error(f"❌ Check if MongoDB service is running and accessible at {MONGO_URI}")
        logger.error(f"❌ Check network connectivity and firewall settings")
        return {
            "status": "failure",
            "error": error_message
        }
    except errors.OperationFailure as e:
        error_message = f"MongoDB authentication failed: {str(e)}"
        logger.error(f"❌ {error_message}")
        logger.error("❌ Check username/password and authentication database")
        return {
            "status": "failure",
            "error": error_message
        }
    except errors.ConnectionFailure as e:
        error_message = f"MongoDB connection failure: {str(e)}"
        logger.error(f"❌ {error_message}")
        logger.error(f"❌ Unable to connect to MongoDB at {MONGO_URI}")
        return {
            "status": "failure",
            "error": error_message
        }
    except Exception as e:
        error_message = f"MongoDB connection failed with unexpected error: {str(e)}"
        logger.error(f"❌ {error_message}")
        logger.error(f"❌ Connection details: URI={MONGO_URI}, DB={MONGO_DB}, Collection={mongo_collection}")
        return {
            "status": "failure",
            "error": error_message
        }

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
            logger.info(f"🔄 Processing stock: {symbol}")
            try:
                existing = collection.find_one({"info.symbol": symbol})
                if existing:
                    logger.info(f"🔍 Stock {symbol}: Found existing document in database (ID: {existing['_id']})")
                    new_history = doc.get("history", [])
                    if new_history:
                        # Check what dates we already have
                        existing_dates = set(entry.get("Date") for entry in existing.get("history", []))
                        added_entries = [entry for entry in new_history if entry.get("Date") not in existing_dates]
                        
                        logger.info(f"📊 Stock {symbol}: Found {len(new_history)} history entries in new data")
                        logger.info(f"📊 Stock {symbol}: Found {len(existing.get('history', []))} history entries in database")
                        logger.info(f"📊 Stock {symbol}: {len(added_entries)} new entries will be added")

                        if added_entries:
                            # Update other fields but preserve history structure
                            update_fields = {k: v for k, v in doc.items() if k != "history"}
                            
                            logger.info(f"🔄 Stock {symbol}: Updating with {len(added_entries)} new history entries")
                            logger.info(f"🔄 Stock {symbol}: Also updating {len(update_fields)} other fields with latest data")
                            
                            try:
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
                                    logger.info(f"✅ Stock {symbol}: Successfully updated document")
                                else:
                                    logger.info(f"ℹ️ Stock {symbol}: Update operation completed but no changes detected")
                                    
                                logger.info(f"✅ Stock {symbol}: Added {len(added_entries)} new history entries while preserving {len(existing.get('history', []))} existing entries")
                            except Exception as e:
                                error_count += 1
                                logger.error(f"❌ Stock {symbol}: Failed to update document: {str(e)}")
                        else:
                            logger.info(f"ℹ️ Stock {symbol}: No new history entries to add (all {len(existing_dates)} dates already exist in database)")
                    else:
                        logger.info(f"ℹ️ Stock {symbol}: No history data found in new document, only updating other fields")
                        try:
                            result = collection.update_one(
                                {"_id": existing["_id"]},
                                {"$set": {k: v for k, v in doc.items() if k != "history"}}
                            )
                            if result.modified_count > 0:
                                update_count += 1
                                logger.info(f"✅ Stock {symbol}: Updated non-history fields successfully")
                        except Exception as e:
                            error_count += 1
                            logger.error(f"❌ Stock {symbol}: Failed to update non-history fields: {str(e)}")
                else:
                    logger.info(f"➕ Stock {symbol}: No existing document found, inserting as new")
                    try:
                        collection.insert_one(doc)
                        insert_count += 1
                        history_count = len(doc.get("history", []))
                        logger.info(f"✅ Stock {symbol}: Successfully inserted as new document with {history_count} history entries")
                    except Exception as e:
                        error_count += 1
                        logger.error(f"❌ Stock {symbol}: Failed to insert document: {str(e)}")
            except errors.PyMongoError as e:
                error_count += 1
                logger.error(f"❌ Stock {symbol}: MongoDB operation failed: {str(e)}")
            except Exception as e:
                error_count += 1
                logger.error(f"❌ Stock {symbol}: Unexpected error: {str(e)}")

            if idx % 10 == 0 or idx == len(data_list):
                logger.info(f"Progress: {idx}/{len(data_list)} documents processed")

        except Exception as e:
            error_count += 1
            logger.error(f"Error processing document {idx} (symbol: {symbol if 'symbol' in locals() else 'unknown'}): {str(e)}")

    elapsed = time.time() - start_time
    
    logger.info("\n" + "=" * 50)
    logger.info("YFINANCE MONGODB LOAD SUMMARY")
    logger.info("=" * 50)
    logger.info(f"⏱️ Execution time: {elapsed:.2f} seconds")
    logger.info(f"📊 Total documents processed: {len(data_list)}")
    logger.info(f"➕ New documents inserted: {insert_count}")
    logger.info(f"🔄 Existing documents updated: {update_count}")
    logger.info(f"📈 Documents with history appended: {history_update_count}")
    logger.info(f"❌ Errors: {error_count}")
    
    if error_count == 0:
        logger.info("✅ SUCCESS: All records processed successfully!")
    elif error_count < len(data_list):
        logger.info(f"⚠️ PARTIAL SUCCESS: {len(data_list) - error_count} of {len(data_list)} records processed successfully")
    else:
        logger.info("❌ FAILURE: No records processed successfully")
    
    client.close()
    logger.info("MongoDB connection closed")

    # Only delete the input file if the operation was successful
    if error_count == 0:
        try:
            os.remove(input_file_path)
            logger.info(f"🗑️ Deleted input file: {input_file_path}")
        except Exception as e:
            logger.error(f"❌ Failed to delete input file: {str(e)}")
    else:
        logger.info(f"⚠️ Not deleting input file due to {error_count} errors during processing")

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
    print("SCRIPT MAIN FUNCTION STARTED", flush=True)
    try:
        print(f"ENVIRONMENT: MONGO_URI={os.environ.get('MONGO_URI', 'NOT SET')}", flush=True)
        print(f"ENVIRONMENT: MONGO_DB={os.environ.get('MONGO_DB', 'NOT SET')}", flush=True)
        print(f"ENVIRONMENT: MONGO_COLLECTION={os.environ.get('MONGO_COLLECTION', 'NOT SET')}", flush=True) 
        print(f"ENVIRONMENT: INPUT_PATH={os.environ.get('INPUT_PATH', 'NOT SET')}", flush=True)
        
        result = load_yfinance_to_mongodb()
        print(f"RESULT: {result}", flush=True)
    except Exception as e:
        print(f"FATAL ERROR: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)