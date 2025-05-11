import json
import os
import requests
from datetime import datetime
# import openai
import re

# Initialize LLM client
# clientAI = OpenAI(base_url="http://192.168.0.203:1234/v1", api_key="gemma-3-4b-it")

from openai import OpenAI
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="YOURSECRETKEY"
)

# Cache for emiten data
emiten_cache = {}
def fetch_emiten_data():
    """Fetch all emiten tickers from local API and cache them"""
    global emiten_cache
    try:
        response = requests.get("http://localhost:5000/api/emiten", timeout=5)
        if response.status_code == 200:
            try:
                tickers = response.json()
                if isinstance(tickers, list):
                    # Create cache with ticker as both key and value since we don't have names
                    emiten_cache = {ticker: ticker for ticker in tickers if isinstance(ticker, str)}
                    print(f"✅ Fetched {len(emiten_cache)} emiten tickers from API")
                else:
                    print("⚠️ API did not return a list of tickers")
            except ValueError:
                print("⚠️ Invalid JSON response from API")
        else:
            print(f"⚠️ API returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Failed to fetch emiten data: {e}")

def get_emiten_name(ticker):
    """Get company name - since we only have tickers, return formatted ticker"""
    if not ticker:
        return None
    # Remove .JK suffix if present
    clean_ticker = ticker.replace('.JK', '')
    # Return formatted ticker since we don't have company names
    return f"{clean_ticker} (Emiten)" 

def extract_ticker(title):
    if not title:
        return None
    
    # 1. Ambil potensi ticker dengan regex
    match = re.search(r'^([A-Z]{2,4})[:\(\-\s]', title)
    if not match:
        return None
    
    potential_ticker = match.group(1)
    
    # 2. Filter kata umum yang bukan ticker
    non_tickers = {"OJK", "BI", "IHGS", "MIND", "USD", "FED", "EU", "US"}
    if potential_ticker in non_tickers:
        return None
    
    # 3. Pastikan ticker ada di daftar resmi (jika ada)
    if emiten_cache and f"{potential_ticker}.JK" not in emiten_cache:
        return None
    
    return potential_ticker

def summarize_news(text):
    response = client.chat.completions.create(
        model="mistralai/mistral-7b-instruct",  # Choose any supported model
        messages=[
            {"role": "system", "content": "Tidak usah menggunakan kalimat pembuka, berikan ringkasan bahasa indonesia berisi sekitar 50 kata dari artikel ini:"},
            {"role": "user", "content": text}
        ]
    )

    res = response.choices[0].message.content
    
    fin = res.split("</think>")#[-1].strip()
    fin [-1]=fin [-1].replace(" (50 kata)", "")
    print(fin[-1])
    return fin[-1].strip()
    # return "placeholder"
        

def analyze_sentiment(text):
    """Analyze sentiment with strict output control"""
    
    response = client.chat.completions.create(
        model="mistralai/mistral-7b-instruct",  # Choose any supported model
        messages=[
            {"role": "system", "content": "Hanya jawab dengan satu kata: positif/netral/negatif"},
            {"role": "user", "content": text}
        ],
        max_tokens=5,
        temperature=0
    )

    res = response.choices[0].message.content
    
    fin = res.split("</think>")#[-1].strip()
    print(fin[-1])
    return fin[-1].strip()

def initialize_json_file(output_path):
    """Initialize a JSON file with an empty array"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump([], f)
    return True

def save_article(output_path, article_data):
    """Save individual article to JSON file while maintaining valid JSON array format"""
    try:
        # If file doesn't exist, create it with an empty array
        if not os.path.exists(output_path):
            initialize_json_file(output_path)
        
        # Read existing data
        with open(output_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                if not isinstance(data, list):
                    print("⚠️ Existing file is not a JSON array. Reinitializing...")
                    data = []
            except json.JSONDecodeError:
                print("⚠️ Invalid JSON in file. Reinitializing...")
                data = []
        
        # Append new article
        data.append(article_data)
        
        # Write back to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        print(f"⚠️ Failed to save article: {e}")
        return False

def get_emiten_name(url):
    # print("Fetching emiten name from URL...")
    tmp = url.split("/")
    tmp = tmp[-1].split("-")
    # print(tmp)
    # print(tmp[0].upper())
    return tmp[0].upper()


def process_article(article, category, output_path):
    """Process and immediately save article"""
    title = article.get('title', '')
    # ticker = extract_ticker(title)

    emiten = None  
    if category == "stock":
        emiten=get_emiten_name(article['url'])
    
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
        processed_data['summary'] = summarize_news(article['text'])
        processed_data['sentimen'] = analyze_sentiment(article['text'])
    
    if save_article(output_path, processed_data):
        print(f"✅ Processed and saved: {title[:50]}...")
    else:
        print(f"❌ Failed to process: {title[:50]}...")
    
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
    # Initialize output file with empty array
    initialize_json_file(output_path)
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for i, article in enumerate(data, 1):
            print(f"Processing article {i}/{len(data)}")
            process_article(article, category, output_path)
        
        print(f"\n✔️ Completed processing {len(data)} articles")
        print(f"📁 Output saved to {output_path}")
    except Exception as e:
        print(f"❌ Error processing file: {e}")

def main(category, date=None):
    """Main workflow"""
    # fetch_emiten_data()
    date = date or datetime.now().strftime("%Y-%m-%d")
    input_file = f"iqplus_{category}_{date}.json"
    # output_file = f"iqplus_{category}_{date}_processed.json"
    output_file = "iqplus_output.json"
    
    # input_path = os.path.join("../output/iqplus_extracted", input_file)
    # output_path = os.path.join("../output/iqplus_extracted", output_file)
    # input_path = os.path.join("/app/output/iqplus_extracted", input_file)
    # output_path = os.path.join("/app/output/iqplus_extracted", output_file)

    # Pakai environment variable, fallback ke default path jika tidak tersedia
    input_dir = os.getenv("INPUT_PATH", "../output")
    output_dir = os.getenv("OUTPUT_PATH", "../output")

    
    # input_dir = os.environ.get('INPUT_PATH')
    # output_dir = os.environ.get('OUTPUT_PATH')

    input_path = os.path.join(input_dir, input_file)
    output_path = os.path.join(output_dir, output_file)



    
    if os.path.exists(input_path):
        print(f"🔧 Processing {input_file}...")
        process_json_file(input_path, output_path, category)
    else:
        print(f"❌ File not found: {input_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True, choices=['market', 'stock'])
    parser.add_argument("--date", help="YYYY-MM-DD (default: today)")
    args = parser.parse_args()
    
    main(args.category, args.date)