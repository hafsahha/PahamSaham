from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time
import os
import zipfile
import xml.etree.ElementTree as ET
import json
import logging
import traceback
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_driver():
    """Configure and return a Chrome WebDriver instance using Selenium Manager"""
    try:
        options = webdriver.ChromeOptions()
        
        # Enhanced headless configuration
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920x1080")  # Larger window size
        
        # Additional options to improve stability
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-infobars")
        options.add_argument("--disable-notifications")
        options.add_argument("--disable-popup-blocking")
        
        # User agent to mimic a real browser
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
        
        prefs = {
            "download.default_directory": zip_folder,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": False
        }
        options.add_experimental_option("prefs", prefs)
        
        # Set capabilities
        options.set_capability('goog:loggingPrefs', {
            'browser': 'ALL',
            'driver': 'ALL',
            'performance': 'ALL'
        })
        
        # Initialize driver using Selenium Manager (no need to specify service)
        logger.info("Initializing Chrome WebDriver with Selenium Manager")
        driver = webdriver.Chrome(options=options)
        
        # Set page load timeout
        driver.set_page_load_timeout(60)
        driver.implicitly_wait(10)
        
        logger.info("Chrome WebDriver initialized successfully")
        return driver
        
    except Exception as e:
        logger.error(f"Failed to setup WebDriver: {str(e)}")
        logger.error(traceback.format_exc())
        raise
    
def download_idx_reports():
    logger.info("Starting to download financial reports from IDX...")
    
    driver = None
    try:
        driver = setup_driver()
        url = "https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan"
        
        # Navigate to URL with retry
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(url)
                # Wait for page to fully load
                WebDriverWait(driver, 30).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                logger.info("Page loaded successfully")
                # Add a delay to ensure JavaScript has fully initialized
                time.sleep(5)
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Failed to load page after {max_retries} attempts: {str(e)}")
                    raise
                logger.warning(f"Page load failed, retry {attempt + 1}")
                time.sleep(5)

        wait = WebDriverWait(driver, 30)

        
        def safe_click(xpath, description, sleep=5):
            for attempt in range(3):
                try:            
                    # Log the page source for debugging
                    logger.info(f"Looking for element: {xpath}")
                    
                    # Wait for element to be present
                    element = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
                    
                    # Scroll to element
                    element = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", element)
                    time.sleep(sleep)
                    
                    # Verify element is really clickable
                    if not element.is_displayed() or not element.is_enabled():
                        raise Exception("Element is not interactable")
                    
                   # Attempt standard click
                    element.click()
                    logger.info(f"Standard click performed on: {description}")
                    
                    time.sleep(sleep)  # Wait after click

                    return True
                
                except Exception as e:
                    if attempt == 3:
                        logger.error(f"Failed to click {description} after 3 attempts: {str(e)}")
                        logger.error(traceback.format_exc())
                        raise
                    logger.warning(f"Click attempt {attempt + 1} failed for {description}, retrying...")
                    time.sleep(5)
            return False

        # Try to find and click elements with both normal and JavaScript clicks
        try:
            safe_click("//input[@id='year1']", "1. Year selection")
            safe_click("//input[@id='period3']", "2. Annual Period")
            safe_click("//button[contains(text(), 'Terapkan')]", "3. apply")
            time.sleep(5)  # Wait for results to load

            # Process download links with pagination
            processed_files = 0
            while True:
                try:
                    # Try to find download links
                    download_links = wait.until(
                        EC.presence_of_all_elements_located((By.XPATH, "//a[contains(@href, 'instance.zip')]"))
                    )
                    
                    if download_links:
                        logger.info(f"Found {len(download_links)} download links on current page")
                        for link in download_links:
                            try:
                                file_url = link.get_attribute("href")
                                logger.info(f"Downloading: {file_url}")
                                driver.get(file_url)
                                processed_files += 1
                                time.sleep(2)  # Brief pause between downloads
                                
                            except Exception as e:
                                logger.error(f"Failed to download file: {str(e)}")
                                continue
                    else:
                        logger.info("No instance.zip files found on this page.")

                    # Pagination handling
                    try:
                        element = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(@class, 'next') and not(@disabled)]")))
                        element = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'next') and not(@disabled)]")))
                        if not element.is_displayed() or not element.is_enabled():
                            raise Exception("Element is not interactable")
                        
                        element.click()
                        
                        logger.info("Clicked next page button")
                        time.sleep(5)  # Wait for next page to load
                    except Exception as e:
                        logger.info("Reached last page of results or pagination error")
                        break

                except Exception as e:
                    logger.error(f"Error during page processing: {str(e)}")
                    logger.error(traceback.format_exc())
                    break

            logger.info(f"Download process completed. Processed {processed_files} files.")

        except Exception as e:
            logger.error(f"Error during interaction with page elements: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    except Exception as e:
        logger.error(f"Fatal error during download process: {str(e)}")
        logger.error(traceback.format_exc())
        raise
    finally:
        if driver:
            try:
                driver.quit()
                logger.info("WebDriver successfully closed")
            except Exception as e:
                logger.error(f"Error while closing WebDriver: {str(e)}")

def process_zip_files():
    logger.info("\nStarting to process downloaded ZIP files...")
    
    try:
        # Check if there are any zip files
        zip_files = [f for f in os.listdir(zip_folder) if f.endswith(".zip")]
        if not zip_files:
            logger.warning(f"No ZIP files found in {zip_folder}")
            
        # Process each ZIP file
        for zip_file in zip_files:
            zip_path = os.path.join(zip_folder, zip_file)
            company_extract_folder = os.path.join(extract_folder, zip_file.split(".")[0])
            
            os.makedirs(company_extract_folder, exist_ok=True)
            
            try:
                with zipfile.ZipFile(zip_path, "r") as zip_ref:
                    zip_ref.extractall(company_extract_folder)
                logger.info(f"Extracted: {zip_file}")
            except Exception as e:
                logger.error(f"Failed to extract {zip_file}: {str(e)}")
                continue
        
    except Exception as e:
        logger.error(f"Error during file processing: {str(e)}")
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    try:
        # set path
        zip_folder = os.environ.get('zip_downloaded_path')
        extract_folder = os.environ.get('zip_extracted_path')
        output_dir = os.environ.get('IDX_OUTPUT_PATH')
        
        # Create directories if they don't exist
        os.makedirs(extract_folder, exist_ok=True)
        os.makedirs(zip_folder, exist_ok=True)
        os.makedirs(os.path.dirname(output_dir), exist_ok=True)
        
        json_output_file = output_dir

        download_idx_reports()
        process_zip_files()
        logger.info("Script execution completed successfully.")

    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        logger.error(traceback.format_exc())