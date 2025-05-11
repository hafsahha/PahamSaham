import os
import json
import requests
import time
import random
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium import webdriver
import argparse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import os
from webdriver_manager.chrome import ChromeDriverManager

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_recent_links(category, days=1, max_pages=10):
    # Calculate the time threshold (24 hours ago from now)
    time_threshold = datetime.now() - timedelta(hours=24*days)
    
    # Set up Chrome options (e.g., for headless mode)
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # Explicit paths
    # chrome_options.binary_location = "/usr/bin/google-chrome"
    # service = Service(executable_path="/usr/bin/chromedriver")
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)

        recent_links = []
        page = 0
        should_continue = True
        
        while should_continue and page < max_pages:
            try:
                # Open the page
                url = f"http://www.iqplus.info/news/{category}/go-to-page,{page}.html"
                # logger.info(f"Processing page: {url}")
                driver.get(url)
                
                # Wait for the news section to load
                news_section = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "news")))
                
                # Process articles on this page
                articles = news_section.find_elements(By.TAG_NAME, "li")
                page_has_recent_articles = False
                
                for article in articles:
                    try:
                        # Extract the date text (format: DD/MM/YY - HH:MM)
                        date_element = article.find_element(By.TAG_NAME, "b")
                        date_text = date_element.text.strip()
                        
                        # Parse the date (day/month/year - hour:minute)
                        article_date = datetime.strptime(date_text, "%d/%m/%y - %H:%M")
                        
                        if article_date >= time_threshold:
                            page_has_recent_articles = True
                            link_element = article.find_element(By.TAG_NAME, "a")
                            link = link_element.get_attribute("href")
                            if link:
                                recent_links+=[link]
                                # logger.info(f"Found recent article: {link} ({date_text})")
                        else:
                            # Articles are sorted newest first, so we can stop after first old article
                            should_continue = False
                            logger.info(f"Found old article ({date_text}), stopping pagination")
                            break
                            
                    except Exception as e:
                        logger.info(f"Error processing article on page {page}: {e}")
                        continue
                
                # If no recent articles on this page, stop pagination
                if not page_has_recent_articles:
                    should_continue = False
                    logger.info("No recent articles found on this page, stopping")
                    
                page += 1
                
            except Exception as e:
                logger.info(f"Error loading page {page}: {e}")
                should_continue = False
        
        driver.quit()
        return recent_links
    except Exception as e:
        logger.info(f"Error initializing Chrome: {str(e)}")
        raise

def scrape_article(url):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        for attempt in range(5):
            try:
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    content_element = soup.find("div", id="zoomthis")
                    if not content_element:
                        logger.info(f"⚠️ Content not found for URL: {url}")
                        return None

                    content = content_element.get_text(separator="\n").strip()
                    raw = [line for line in content.split("\n") if line.strip()]

                    if len(raw) < 3:
                        logger.info(f"⚠️ Incomplete data at {url}")
                        return None

                    return {
                        "date": raw[0],
                        "title": raw[1],
                        "text": ' '.join(raw[2:]).strip(),
                        "url": url
                    }

                else:
                    logger.info(f"❌ Request failed for {url} with status: {response.status_code}")
                    return None

            except requests.exceptions.RequestException as e:
                logger.info(f"⚠️ Connection failed for {url} (Attempt {attempt + 1}/5): {e}")
                time.sleep(random.uniform(2, 5))

        logger.info(f"❌ Failed to get data after 5 attempts: {url}")
        return None
def save_to_json(data, category, output_dir):
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Create filename with current date
        today = datetime.now().strftime("%Y-%m-%d")
        json_file = os.path.join(output_dir, f"iqplus_{category}_{today}.json")
        
        # Load existing data or create new list
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as file:
                    existing_data = json.load(file)
                    if not isinstance(existing_data, list):
                        existing_data = []
            except (json.JSONDecodeError, OSError) as e:
                logger.info(f"⚠️ Error reading {json_file}: {e}")
                existing_data = []
        else:
            existing_data = []
        
        # Add new data
        existing_data.append(data)
        
        # Save back to file
        try:
            with open(json_file, "w", encoding="utf-8") as file:
                json.dump(existing_data, file, ensure_ascii=False, indent=4)
            logger.info(f"✅ Data saved to {json_file}")
        except OSError as e:
            logger.info(f"❌ Failed to save data to {json_file}: {e}")

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Scrape IQ Plus news articles')
    parser.add_argument('--category', type=str, default='market',
                       help='News category to scrape (default: market)')
    parser.add_argument('--output', type=str, default='output/',
                       help='Output directory (default: output/)')
    parser.add_argument('--pages', type=int, default=1,
                       help='Number of pages to scrape (default: 1)')
    
    args = parser.parse_args()

    # Get recent links
    links = get_recent_links(f"{args.category}_news", args.pages)
    logger.info(f"🔍 Found {len(links)} recent articles")

    # Process each article
    for link in links:
        logger.info(f"\n📄 Processing article: {link}")
        article_data = scrape_article(link)
        if article_data:
            save_to_json(article_data, args.category, args.output)
    
    logger.info("✅ Scraping completed!")

if __name__ == "__main__":
    main()

'''
With default values (market category):
python script.py

With custom category:
python script.py --category stock

With all custom parameters:
python script.py --category market --output output/ --pages 3

'''