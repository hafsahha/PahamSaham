import json
import os
import requests
from datetime import datetime
import re
import logging
from ollama import Client
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Ollama client
OLLAMA_API = os.getenv("OLLAMA_API", "http://ollama:11434")
client = Client(host=OLLAMA_API)

def check_ollama_availability():
    """Check if Ollama service is available"""
    try:
        response = requests.get(f"{OLLAMA_API}/api/tags", timeout=5)
        logger.info(f"Ollama response: {response.text}")
        if response.status_code == 200:
            logger.info("✅ Ollama service is available")
            return True
        else:
            logger.error(f"⚠️ Ollama service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"⚠️ Failed to connect to Ollama: {e}")
        return False

# Cache for emiten data
emiten_cache = {}

def fetch_emiten_data():
    """Fetch all emiten tickers from local API and cache them"""
    global emiten_cache
    try:
        response = requests.get("http://api:5000/api/emiten", timeout=5)
        if response.status_code == 200:
            try:
                tickers = response.json()
                if isinstance(tickers, list):
                    emiten_cache = {ticker: ticker for ticker in tickers if isinstance(ticker, str)}
                    logger.info(f"✅ Fetched {len(emiten_cache)} emiten tickers from API")
                else:
                    logger.info("⚠️ API did not return a list of tickers")
            except ValueError:
                logger.info("⚠️ Invalid JSON response from API")
        else:
            logger.info(f"⚠️ API returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.info(f"⚠️ Failed to fetch emiten data: {e}")

def get_emiten_name(ticker):
    """Get company name - since we only have tickers, return formatted ticker"""
    if not ticker:
        return None
    clean_ticker = ticker.replace('.JK', '')
    return f"{clean_ticker} (Emiten)"

def extract_ticker(title):
    """Extract ticker from article title"""
    if not title:
        return None
    match = re.search(r'^([A-Z]{2,4})[:\(\-\s]', title)
    if not match:
        return None
    potential_ticker = match.group(1)
    non_tickers = {"OJK", "BI", "IHGS", "MIND", "USD", "FED", "EU", "US"}
    if potential_ticker in non_tickers:
        return None
    if emiten_cache and f"{potential_ticker}.JK" not in emiten_cache:
        return None
    return potential_ticker

def summarize_news(text):
    """Summarize news article using local Ollama model"""
    text = text[:4000]  # Batasi teks ke 4000 karakter
    logger.info(f"Starting summarization for text with length: {len(text)} characters")
    start_time = time.time()
    try:
        response = client.chat(
            model="tinyllama",
            messages=[
                {"role": "system", "content": "Tidak usah menggunakan kalimat pembuka, berikan ringkasan bahasa Indonesia berisi sekitar 50 kata dari artikel ini:"},
                {"role": "user", "content": text}
            ]
        )
        summary = response['message']['content'].strip()
        summary = summary.replace(" (50 kata)", "")
        logger.info(f"Finished summarization in {time.time() - start_time:.2f} seconds")
        return summary
    except Exception as e:
        logger.error(f"⚠️ Failed to summarize news: {e}")
        return ""

def analyze_sentiment(text):
    """Analyze sentiment using local Ollama model"""
    text = text[:4000]  # Batasi teks ke 4000 karakter
    logger.info(f"Starting sentiment analysis for text with length: {len(text)} characters")
    start_time = time.time()
    try:
        response = client.chat(
            model="tinyllama",
            messages=[
                {"role": "system", "content": "Hanya jawab dengan satu kata: positif/netral/negatif"},
                {"role": "user", "content": text}
            ],
            options={"temperature": 0}
        )
        sentiment = response['message']['content'].strip().lower()
        logger.info(f"Finished sentiment analysis in {time.time() - start_time:.2f} seconds")
        if sentiment not in ["positif", "netral", "negatif"]:
            logger.warning(f"⚠️ Invalid sentiment received: {sentiment}. Defaulting to netral.")
            return "netral"
        return sentiment
    except Exception as e:
        logger.error(f"⚠️ Failed to analyze sentiment: {e}")
        return "netral"

def initialize_json_file(output_path):
    """Initialize a JSON file with an empty array"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump([], f)
    return True

def save_article(output_path, article_data):
    """Save individual article to JSON file while maintaining valid JSON array format"""
    try:
        if not os.path.exists(output_path):
            initialize_json_file(output_path)
        with open(output_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                if not isinstance(data, list):
                    logger.info("⚠️ Existing file is not a JSON array. Reinitializing...")
                    data = []
            except json.JSONDecodeError:
                logger.info("⚠️ Invalid JSON in file. Reinitializing...")
                data = []
        data.append(article_data)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"⚠️ Failed to save article: {e}")
        return False

def get_emiten_name_from_url(url):
    """Extract emiten name from URL"""
    try:
        tmp = url.split("/")[-1].split("-")
        return tmp[0].upper()
    except Exception as e:
        logger.error(f"⚠️ Failed to extract emiten from URL: {e}")
        return None

def process_article(article, category, output_path):
    """Process and immediately save article"""
    title = article.get('title', '')
    logger.info(f"Starting processing for article: {title[:50]}...")
    start_time = time.time()
    
    emiten = None
    if category == "stock":
        logger.info("Extracting emiten from URL...")
        emiten = get_emiten_name_from_url(article['url'])
        logger.info(f"Emiten extracted: {emiten}")
    
    processed_data = {
        'date': convert_date_format(article.get('date')),
        'title': title,
        'url': article['url'],
        'text': article['text'],
        'processed': True,
        'emiten': emiten,
        'category': category,
        'publisher': 'iqplus'
    }
    
    if 'text' in article and article['text'].strip():
        logger.info("Generating summary...")
        processed_data['summary'] = summarize_news(article['text'])
        logger.info("Generating sentiment...")
        processed_data['sentimen'] = analyze_sentiment(article['text'])
        logger.info("Summary and sentiment generated.")
    
    logger.info("Saving article to output...")
    if save_article(output_path, processed_data):
        logger.info(f"✅ Processed and saved: {title[:50]}... in {time.time() - start_time:.2f} seconds")
    else:
        logger.error(f"❌ Failed to process: {title[:50]}...")
    
    return processed_data

def convert_date_format(date_str):
    """Convert date from 'dd/mm/yy - HH:MM' to 'dd/mm/YYYY HH:MM'"""
    if not date_str:
        return datetime.now().strftime("%d/%m/%Y %H:%M")
    try:
        dt = datetime.strptime(date_str, "%d/%m/%y - %H:%M")
        return dt.strftime("%d/%m/%Y %H:%M")
    except ValueError:
        return datetime.now().strftime("%d/%m/%Y %H:%M")

def process_json_file(input_path, output_path, category):
    """Process JSON file with immediate saving of each article"""
    initialize_json_file(output_path)
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for i, article in enumerate(data, 1):
            logger.info(f"Processing article {i}/{len(data)}")
            process_article(article, category, output_path)
        logger.info(f"\n✔️ Completed processing {len(data)} articles")
        logger.info(f"📁 Output saved to {output_path}")
    except Exception as e:
        logger.error(f"❌ Error processing file: {e}")

def main(category, date=None):
    check_ollama_availability()
    """Main workflow"""
    date = date or datetime.now().strftime("%Y-%m-%d")
    input_file = f"iqplus_{category}_{date}.json"
    output_file = "iqplus_output.json"
    
    input_dir = os.getenv("INPUT_PATH", "../output")
    output_dir = os.getenv("OUTPUT_PATH", "../output")
    
    input_path = os.path.join(input_dir, input_file)
    output_path = os.path.join(output_dir, output_file)
    
    if os.path.exists(input_path):
        logger.info(f"🔧 Processing {input_file}...")
        process_json_file(input_path, output_path, category)
    else:
        logger.error(f"❌ File not found: {input_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True, choices=['market', 'stock'])
    parser.add_argument("--date", help="YYYY-MM-DD (default: today)")
    args = parser.parse_args()
    
    main(args.category, args.date)