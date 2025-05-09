from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
import zipfile
import xml.etree.ElementTree as ET
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_driver():
    """Configure and return a Chrome WebDriver instance"""
    try:
        # Setup Chrome options
        options = webdriver.ChromeOptions()
        
        # Set download folder
        download_dir = os.path.join(os.getcwd(), "idx_zip")
        if not os.path.exists(download_dir):
            os.makedirs(download_dir)
            logger.info(f"Created download directory: {download_dir}")
        
        prefs = {
            "download.default_directory": download_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        options.add_experimental_option("prefs", prefs)
        
        # Headless options for Docker
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        
        # Use webdriver-manager to handle ChromeDriver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        return driver
    except Exception as e:
        logger.error(f"Failed to setup WebDriver: {str(e)}")
        raise

def download_idx_reports():
    """Download financial reports from IDX website"""
    logger.info("Starting to download financial reports from IDX...")
    
    try:
        driver = setup_driver()
        url = "https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan"
        driver.get(url)

        wait = WebDriverWait(driver, 30)
        
        # Select Financial Reports
        wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@id='FinancialStatement']"))).click()
        
        # Select Stock as Security Type
        wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@id='TypeSaham']"))).click()

        logger.info("\n=== Retrieving data for year 2024 ===")

        # Select latest year
        wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@id='year1']"))).click()
        
        # Select Annual Period
        wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@id='period3']"))).click()

        # Click Apply button if available
        try:
            driver.find_element(By.XPATH, "//button[contains(text(), 'Terapkan')]").click()
            logger.info("Apply button clicked.")
        except Exception as e:
            logger.warning(f"Apply button not found: {str(e)}")

        time.sleep(5)  # Wait for data to load

        while True:
            download_links = driver.find_elements(By.XPATH, "//a[contains(@href, 'instance.zip')]")
            
            if download_links:
                for link in download_links:
                    file_url = link.get_attribute("href")
                    logger.info(f"Downloading: {file_url}")
                    driver.get(file_url)
                    time.sleep(1)
            else:
                logger.info("No instance.zip files found on this page.")

            # Pagination handling
            try:
                next_button = driver.find_element(By.XPATH, "//button[contains(@class, 'next') and not(@disabled)]")
                next_button.click()
                time.sleep(3)
            except Exception as e:
                logger.info("Reached last page of results")
                break

    except Exception as e:
        logger.error(f"Error during download process: {str(e)}")
        raise
    finally:
        if 'driver' in locals():
            driver.quit()
        logger.info("Download process completed.")

def process_zip_files():
    """Process downloaded ZIP files and extract XBRL/XML data"""
    logger.info("\nStarting to process downloaded ZIP files...")
    
    try:
        zip_folder = os.path.join(os.getcwd(), "idx_zip")
        extract_folder = os.path.join(os.getcwd(), "idx_extracted")
        output_dir = os.path.join(os.path.dirname(os.getcwd()), "output")
        
        # Create directories if they don't exist
        os.makedirs(extract_folder, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        
        json_output_file = os.path.join(output_dir, "idx_extract.json")
        all_data = []
        
        # Process each ZIP file
        for zip_file in os.listdir(zip_folder):
            if zip_file.endswith(".zip"):
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
        
        # Process extracted files
        for company in os.listdir(extract_folder):
            company_path = os.path.join(extract_folder, company)
            
            if os.path.isdir(company_path):
                for file in os.listdir(company_path):
                    if file.endswith((".xbrl", ".xml")):
                        file_path = os.path.join(company_path, file)
                        
                        try:
                            tree = ET.parse(file_path)
                            root = tree.getroot()
                            
                            data = {
                                "filename": file,
                                "company": company,
                                "data": {}
                            }
                            
                            for elem in root.iter():
                                tag = elem.tag.split("}")[-1]
                                if elem.text and elem.text.strip():
                                    data["data"][tag] = elem.text.strip()
                            
                            all_data.append(data)
                            logger.info(f"Processed: {file}")
                            
                        except Exception as e:
                            logger.error(f"Failed to process {file}: {str(e)}")
        
        # Save to JSON
        with open(json_output_file, "w", encoding="utf-8") as json_file:
            json.dump(all_data, json_file, indent=4, ensure_ascii=False)
            
        logger.info(f"Data saved to {json_output_file}")
        
    except Exception as e:
        logger.error(f"Error during file processing: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        download_idx_reports()
        process_zip_files()
        logger.info("Script execution completed successfully.")
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        raise