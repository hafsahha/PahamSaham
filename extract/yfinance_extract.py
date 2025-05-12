"""
Extract module for yfinance data
This module is responsible for fetching daily stock data from yfinance
"""

import yfinance as yf
import pandas as pd
import time
from datetime import datetime
import json
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# List of stocks to fetch
STOCKS = [
    # BANKING SECTOR
    "BBRI.JK", "BMRI.JK", "BBCA.JK", "BBNI.JK", "BJBR.JK", "BJTM.JK", "AGRO.JK", "BBKP.JK", "BDMN.JK", 
    "NISP.JK", "PNBN.JK", "BCIC.JK", "MAYA.JK", "ARTO.JK", "BTPS.JK", "AMAR.JK", "NOBU.JK", "BINA.JK",
    "BSIM.JK", "BNGA.JK", "BGTG.JK", "BNLI.JK", "BABP.JK", "BBYB.JK", "BEKS.JK", "BMAS.JK", "BOSS.JK",

    # ENERGY SECTOR
    "ADRO.JK", "ITMG.JK", "PTBA.JK", "MEDC.JK", "PGAS.JK", "ELSA.JK", "AKRA.JK", "HRUM.JK", "INDY.JK",
    "MBAP.JK", "BIPI.JK", "DOID.JK", "ENRG.JK", "RAJA.JK", "GEMS.JK", "TPIA.JK", "BRPT.JK", "ESSA.JK",
    "PSAB.JK", "SMMT.JK", "BREN.JK", "TOBA.JK", "CNKO.JK", "MARI.JK", "BUMI.JK", "SUGI.JK", "DWGL.JK",

    # CONSUMER GOODS
    "UNVR.JK", "ICBP.JK", "INDF.JK", "MYOR.JK", "SIDO.JK", "KAEF.JK", "PEHA.JK", "KLBF.JK", "GOOD.JK",
    "DMND.JK", "KINO.JK", "ALTO.JK", "AISA.JK", "HOKI.JK", "CLEO.JK", "ULTJ.JK", "ADES.JK", "ROTI.JK",
    "FOOD.JK", "CMRY.JK", "SAPX.JK", "STTP.JK", "MRAT.JK", "FITT.JK", "NAYZ.JK", "TSPC.JK", "CBMF.JK",

    # INFRASTRUCTURE & TELECOMMUNICATION
    "TLKM.JK", "EXCL.JK", "ISAT.JK", "FREN.JK", "TOWR.JK", "SUPR.JK", "JSMR.JK", "CMNP.JK", "WIKA.JK",
    "PTPP.JK", "ADHI.JK", "WSKT.JK", "WTON.JK", "KRAS.JK", "SMGR.JK", "INTP.JK", "LPKR.JK", "PWON.JK",
    "NRCA.JK", "TOTL.JK", "ACST.JK", "MTLA.JK", "PPRO.JK", "KIJA.JK", "JRPT.JK", "CTRA.JK", "DMAS.JK",

    # PROPERTY & REAL ESTATE
    "BSDE.JK", "CTRA.JK", "SMRA.JK", "ASRI.JK", "DMAS.JK", "COWL.JK", "OMRE.JK", "KIJA.JK", "MTLA.JK",
    "JRPT.JK", "PPRO.JK", "NIRO.JK", "BKSL.JK", "URBN.JK", "PLIN.JK", "MKPI.JK", "PWON.JK", "LMAS.JK",
    "DILD.JK", "ELTY.JK", "RDTX.JK", "TARA.JK", "LPCK.JK", "MDLN.JK", "SIPD.JK", "JGLE.JK",

    # TRANSPORTATION & LOGISTICS
    "GIAA.JK", "ASSA.JK", "SMDR.JK", "TMAS.JK", "HITS.JK", "SAFE.JK", "JSMR.JK", "MCOL.JK", "WEHA.JK",
    "BIRD.JK", "SAPX.JK", "BLTA.JK", "MBTO.JK", "IPCC.JK", "DEPO.JK", "NELY.JK", "CMPP.JK", "JAYA.JK",
    "ADES.JK", "TRUK.JK", "WEHA.JK", "LION.JK", "TAXI.JK", "JAYA.JK",

    # METAL & MINING
    "ANTM.JK", "INCO.JK", "MDKA.JK", "PSAB.JK", "TINS.JK", "HRTA.JK", "ZINC.JK", "DKFT.JK", "BOSS.JK",
    "KKGI.JK", "BIPI.JK", "TOBA.JK", "GEMS.JK", "DOID.JK", "MBAP.JK", "CITA.JK", "NICL.JK",
    "NIKL.JK", "SMRU.JK", "PTRO.JK", "SPTO.JK", "MAMI.JK", "LSIP.JK", "MGRO.JK", "TAPG.JK", "STAA.JK",

    # RETAIL & DISTRIBUTION
    "ACES.JK", "MAPI.JK", "RALS.JK", "LPPF.JK", "MPPA.JK", "AMRT.JK", "ERAA.JK", "CSAP.JK", "PRDA.JK",
    "TELE.JK", "KIOS.JK", "DIVA.JK", "DIGI.JK", "NFCX.JK", "GLOB.JK", "MCAS.JK", "TFAS.JK", "MDKA.JK",
    "DNET.JK", "PDES.JK", "MIDI.JK", "MAPA.JK", "OPMS.JK", "BATA.JK", "UNVR.JK", "INAF.JK",

    # FINTECH & TECHNOLOGY
    "GOTO.JK", "BUKA.JK", "DCII.JK", "EDGE.JK", "MTDL.JK", "SKYB.JK", "ALDO.JK", "YELO.JK", "MPXL.JK",
    "MCAS.JK", "BALI.JK", "TFAS.JK", "DIVA.JK", "NFCX.JK", "WIFI.JK", "DMMX.JK", "BIRD.JK", "DEPO.JK",
    "SLIS.JK", "TRIO.JK", "TECH.JK", "CLAY.JK", "LUCY.JK", "AGII.JK", "AXIO.JK",

    # MANUFACTURING
    "SMSM.JK", "AUTO.JK", "ASII.JK", "GJTL.JK", "IMAS.JK", "SPMA.JK", "INDS.JK", "PRAS.JK", "SSTM.JK",
    "INDR.JK", "ICBP.JK", "INDF.JK", "PICO.JK", "LTLS.JK", "INTA.JK", "MASA.JK", "DUTI.JK", "BTON.JK",
    "DKFT.JK", "TRST.JK", "STTP.JK", "ALMI.JK", "CASS.JK", "AGRO.JK", "BTON.JK", "GGRP.JK", "BRNA.JK",
]

# Output file path (can be configured via environment variable)
OUTPUT_FILE_PATH = os.environ.get('YFINANCE_OUTPUT_PATH')

def extract_daily_data():
    """
    Extract stock data from yfinance for the last day only
    Returns the path to the saved JSON file
    """
    start_time_total = time.time()
    
    # List to store stock data (changed from dictionary to list for direct MongoDB compatibility)
    stock_data_list = []
    success_list = []
    failed_list = {}
    time_per_stock = {}
    
    # Get current date for fetch_date field
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    logger.info(f"Starting data extraction process at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Total stocks to process: {len(STOCKS)}")
    logger.info("-" * 50)
    
    for idx, stock in enumerate(STOCKS, 1):
        try:
            # Record start time for each stock
            start_time_stock = time.time()
            
            logger.info(f"[{idx}/{len(STOCKS)}] Fetching data for {stock}...")
            
            ticker = yf.Ticker(stock)
            info = ticker.info
            
            # Get only the last day's data
            history = ticker.history(period="1d")
            
            # Check if history is empty
            if history.empty:
                logger.warning(f"No data available for {stock} today, skipping...")
                failed_list[stock] = "No data available"
                continue
            
            # Convert DataFrame to JSON-friendly format
            history.reset_index(inplace=True)
            history["Date"] = history["Date"].astype(str)  # Convert Timestamp to String
            
            # Create document for MongoDB with standardized structure
            stock_doc = {
                "_id": stock,  # Use stock code as unique ID
                "symbol": stock,
                "update_date": current_date,
                "info": info,
                "history": history.to_dict(orient="records")  # List format
            }
            stock_data_list.append(stock_doc)
            
            # Calculate time taken for this stock
            elapsed_time = time.time() - start_time_stock
            time_per_stock[stock] = elapsed_time
            
            success_list.append(stock)
            logger.info(f"Data for {stock} fetched successfully in {elapsed_time:.2f} seconds")
            
        except Exception as e:
            elapsed_time = time.time() - start_time_stock
            failed_list[stock] = str(e)
            logger.error(f"Failed to fetch data for {stock} ({elapsed_time:.2f} seconds) - {str(e)}")
    
    # Calculate total time
    total_elapsed_time = time.time() - start_time_total
    
    # Print results summary
    logger.info("\n" + "=" * 50)
    logger.info(f"EXTRACTION PROCESS SUMMARY")
    logger.info("=" * 50)
    logger.info(f"Total execution time: {total_elapsed_time:.2f} seconds ({total_elapsed_time/60:.2f} minutes)")
    logger.info(f"Number of stocks successfully fetched: {len(success_list)} out of {len(STOCKS)}")
    logger.info(f"Number of stocks failed: {len(failed_list)}")
    
    # Statistics on time
    if success_list:
        avg_time = sum(time_per_stock.values()) / len(success_list)
        max_time = max(time_per_stock.values()) if time_per_stock else 0
        min_time = min(time_per_stock.values()) if time_per_stock else 0
        slowest_stock = max(time_per_stock, key=time_per_stock.get) if time_per_stock else 'N/A'
        fastest_stock = min(time_per_stock, key=time_per_stock.get) if time_per_stock else 'N/A'
        
        logger.info("\nTIME STATISTICS:")
        logger.info(f"- Average time per stock: {avg_time:.2f} seconds")
        logger.info(f"- Fastest stock: {fastest_stock} ({min_time:.2f} seconds)")
        logger.info(f"- Slowest stock: {slowest_stock} ({max_time:.2f} seconds)")
    
    if failed_list:
        logger.info("\nFailed stocks:")
        for stock, error in failed_list.items():
            logger.info(f"- {stock}: {error}")
    
    # Save to file
    try:
        with open(OUTPUT_FILE_PATH, 'w', encoding='utf-8') as json_file:
            json.dump(stock_data_list, json_file, ensure_ascii=False, indent=4)
        logger.info(f"\nData saved to {OUTPUT_FILE_PATH}")
    except Exception as e:
        logger.error(f"Failed to save data to file: {str(e)}")
        raise
    
    return OUTPUT_FILE_PATH

if __name__ == "__main__":
    # Can be run as a standalone script for testing
    extract_daily_data()