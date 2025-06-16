from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date, date_format, avg
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
import os
import json
from bson import json_util
from datetime import datetime, timedelta

# === Konfigurasi ===
app = Flask(__name__)
CORS(app)
client = MongoClient("mongodb+srv://big3:daffzidliahafmail@dontsteal.3huq1f6.mongodb.net/")
db = client["bigdata_saham"]
collection = db["yfinance_data"]
iqplus_collection = db["iqplus_data"]
idx_collection = db["idx_data"]
# os.environ["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"

spark = SparkSession.builder.appName("SahamApp").config("spark.ui.port", "4050").getOrCreate()

# === Helper ===
def safe_float(v): return float(v) if v not in [None, ""] else 0.0
def safe_int(v): return int(v) if v not in [None, ""] else 0


def parse_json(data):
    return json.loads(json_util.dumps(data))

def load_data(emiten):
    doc = collection.find_one({ "info.symbol": { "$regex": f"^{emiten}$", "$options": "i" } })
    if not doc: return None

    history = doc.get("history", [])
    data = [{
        "symbol": doc["info"].get("symbol", emiten),
        "Date": str(r.get("Date", "")).split("T")[0],
        "Open": safe_float(r.get("Open")),
        "High": safe_float(r.get("High")),
        "Low": safe_float(r.get("Low")),
        "Close": safe_float(r.get("Close")),
        "Volume": float(safe_int(r.get("Volume")))
    } for r in history if r]

    if not data: return None

    schema = StructType([
        StructField("symbol", StringType(), True),
        StructField("Date", StringType(), True),
        StructField("Open", DoubleType(), True),
        StructField("High", DoubleType(), True),
        StructField("Low", DoubleType(), True),
        StructField("Close", DoubleType(), True),
        StructField("Volume", DoubleType(), True),
    ])

    df = spark.createDataFrame(data, schema=schema)
    return df.withColumn("Date", to_date("Date"))

# === Endpoint: Daftar Emiten ===
@app.route("/api/emiten")
def get_emiten():
    return jsonify(collection.distinct("info.symbol"))

# === Endpoint: Harga Saham Berdasarkan Periode ===
@app.route("/api/harga")
def get_harga():
    emiten = request.args.get("emiten")
    period = request.args.get("period", "daily")
    if not emiten or period not in ["daily", "monthly", "yearly"]:
        return jsonify({"error": "Parameter tidak valid"}), 400
    
    # Cek apakah ini simbol khusus
    is_index = emiten.startswith('^') 
    is_forex = emiten.endswith('=X')
    is_commodity = emiten.endswith('=F')
    
    # Jika simbol khusus (indeks/forex/commodity)
    if is_index or is_forex or is_commodity:
        # Coba temukan di collection khusus jika ada
        # Untuk sekarang, kita akan mengembalikan error yang informatif
        symbol_type = "indeks" if is_index else ("forex" if is_forex else "komoditas")
        message = f"Data untuk {symbol_type} '{emiten}' belum tersedia di database. " + \
                 f"Silakan tambahkan {symbol_type} ini ke database MongoDB terlebih dahulu."
        return jsonify({"error": message}), 404
    
    # Untuk saham reguler, gunakan data dari database
    df = load_data(emiten)
    if not df or df.count() == 0:
        return jsonify({"error": f"Data untuk emiten '{emiten}' tidak ditemukan di database"}), 404

    fmt = {"daily": "Date", "monthly": "yyyy-MM", "yearly": "yyyy"}
    df = df.withColumn("period", df["Date"] if period == "daily" else date_format("Date", fmt[period]))

    agg = df.groupBy("period").agg(
        avg("Open").alias("Open"),
        avg("High").alias("High"),
        avg("Low").alias("Low"),
        avg("Close").alias("Close"),
        avg("Volume").alias("Volume")
    ).orderBy("period")

    return jsonify([{
        "Symbol": emiten.upper(),
        "Date": str(r["period"]),
        "Open": round(r["Open"], 2),
        "High": round(r["High"], 2),
        "Low": round(r["Low"], 2),
        "Close": round(r["Close"], 2),
        "Volume": int(r["Volume"] or 0)
    } for r in agg.collect() if r["Open"] is not None])

# === Endpoint: Data Keuangan IDX ===
@app.route("/api/idx/finance")
def get_idx_financials():
    entity_code = request.args.get("entity_code")
    if not entity_code:
        return jsonify({"error": "Parameter 'entity_code' wajib diisi"}), 400

    # Ambil semua record yang sesuai dengan entity_code
    data = db["idx_data"].find({"EntityCode": entity_code})

    # Jika tidak ada data ditemukan, kembalikan error
    if not data:
        return jsonify({"error": f"Tidak ditemukan data untuk '{entity_code}'"}), 404

    # Convert data MongoDB ke list dan hapus _id
    result = []
    for record in data:
        record.pop("_id", None)
        result.append(record)

    return jsonify(result)


@app.route('/api/idx/')
def get_all_idx():
    """Endpoint untuk semua data IDX"""
    try:
        news = list(idx_collection.find({}))
        return jsonify({
            'status': 'success',
            'data': parse_json(news),
            'count': len(news)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    
# === Endpoint: Data Berita IQPlus ===
@app.route('/api/iqplus/')
def get_all_news():
    """Endpoint untuk semua berita IQ Plus"""
    try:
        news = list(iqplus_collection.find({}))
        return jsonify({
            'status': 'success',
            'data': parse_json(news),
            'count': len(news)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# === Endpoint: Top Stocks ===
@app.route('/api/top-stocks')
def get_top_stocks():
    """Endpoint untuk mendapatkan saham top gainers/losers berdasarkan perubahan harga"""
    try:
        filter_type = request.args.get('filter', 'gainers')  # 'gainers' atau 'losers'
        limit = int(request.args.get('limit', 5))  # Jumlah saham yang ditampilkan
        
        # Dapatkan semua saham yang memiliki history
        stocks = []
        cursor = collection.find({
            "$and": [
                {"history": {"$exists": True}},
                {"history": {"$not": {"$size": 0}}}
            ]
        })
        
        for doc in cursor:
            if "history" not in doc or not doc["history"]:
                continue
                
            # Ambil data terakhir dan sebelumnya untuk menghitung perubahan
            latest = doc["history"][0] if doc["history"] else None
            previous = doc["history"][1] if len(doc["history"]) > 1 else None
            
            if not latest or not previous:
                continue
                
            symbol = doc.get("symbol", "Unknown")
            company_name = doc.get("info", {}).get("longName", symbol)
            
            close_value = safe_float(latest.get("Close", 0))
            prev_close = safe_float(previous.get("Close", close_value))
            
            if prev_close == 0:
                continue
                
            change_percent = ((close_value - prev_close) / prev_close * 100)
            
            stocks.append({
                "symbol": symbol,
                "name": company_name,
                "price": close_value,
                "change": close_value - prev_close,
                "changePercent": round(change_percent, 2)
            })
        
        # Urutkan berdasarkan filter
        if filter_type == 'gainers':
            stocks.sort(key=lambda x: x['changePercent'], reverse=True)
        else:
            stocks.sort(key=lambda x: x['changePercent'])
            
        return jsonify(stocks[:limit])
        
    except Exception as e:
        print(f"Error getting top stocks: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# === Endpoint: Market Overview ===
@app.route('/api/market-overview')
def get_market_overview():
    """Endpoint untuk data ringkasan pasar (indices, sectors, commodities, forex)"""
    try:
        data_type = request.args.get('type', 'indices')
        
        if data_type == 'indices':
            # Dapatkan data indeks saham dari yfinance_data
            indices = [
                {"name": "IHSG", "symbol": "^JKSE"},
                {"name": "LQ45", "symbol": "^JKLQ45"},
                {"name": "IDX80", "symbol": "^IDXOHLC"},
                {"name": "IDXBUMN20", "symbol": "^IDXBUMN"},
                {"name": "IDXESGL", "symbol": "^IDXESGL"}
            ]
            
            result = []
            for idx in indices:
                doc = collection.find_one({"symbol": idx["symbol"]})
                if doc and "history" in doc and len(doc["history"]) > 0:
                    latest = doc["history"][0]  # Data terbaru
                    previous = doc["history"][1] if len(doc["history"]) > 1 else None
                    
                    close_value = safe_float(latest.get("Close", 0))
                    prev_close = safe_float(previous.get("Close", close_value)) if previous else close_value
                    change_percent = ((close_value - prev_close) / prev_close * 100) if prev_close else 0
                    
                    result.append({
                        "name": idx["name"],
                        "value": close_value,
                        "changePercent": round(change_percent, 2)
                    })
            
            if not result:
                # Jika tidak ada data indeks, coba ambil beberapa saham populer sebagai gantinya
                popular_stocks = ["BBRI.JK", "BBCA.JK", "TLKM.JK", "ASII.JK", "BMRI.JK"]
                
                # Ambil data saham populer dari database
                for stock_symbol in popular_stocks:
                    doc = collection.find_one({"symbol": stock_symbol})
                    if doc and "history" in doc and len(doc["history"]) > 0:
                        latest = doc["history"][0]  # Data terbaru
                        previous = doc["history"][1] if len(doc["history"]) > 1 else None
                        
                        name = doc.get("info", {}).get("shortName", stock_symbol)
                        if not name or name == stock_symbol:
                            name = doc.get("info", {}).get("longName", stock_symbol)
                        
                        close_value = safe_float(latest.get("Close", 0))
                        prev_close = safe_float(previous.get("Close", close_value)) if previous else close_value
                        
                        change_percent = ((close_value - prev_close) / prev_close * 100) if prev_close else 0
                        
                        result.append({
                            "name": name,
                            "value": close_value,
                            "changePercent": round(change_percent, 2)
                        })
                        
                        # Hanya ambil maksimal 5 saham
                        if len(result) >= 5:
                            break
                  # Jika tetap tidak ada data sama sekali
                if not result:
                    return jsonify({'status': 'error', 'message': f'Tidak ada data tersedia dari collection yfinance_data'}), 404
                    
        elif data_type == 'sectors':
            # Ambil semua data saham dari database dan kelompokkan berdasarkan sektor
            try:
                sector_map = {}
                
                # Ambil semua dokumen dari koleksi yfinance_data
                all_stocks = collection.find({})
                
                # Kelompokkan saham berdasarkan sektor
                for stock in all_stocks:
                    if 'info' in stock and 'sector' in stock['info']:
                        sector_name = stock['info']['sector']
                        
                        # Jika sektor belum ada dalam map, tambahkan dengan nilai awal
                        if sector_name not in sector_map:
                            sector_map[sector_name] = {
                                'stockCount': 0,
                                'totalValue': 0.0,
                                'totalChangePercent': 0.0
                            }
                        
                        # Ambil data history jika tersedia
                        if 'history' in stock and len(stock['history']) > 1:
                            latest = stock['history'][0]  # Data terbaru
                            previous = stock['history'][1] if len(stock['history']) > 1 else None
                            
                            close_value = safe_float(latest.get("Close", 0))
                            prev_close = safe_float(previous.get("Close", close_value)) if previous else close_value
                            
                            if prev_close > 0:  # Hindari pembagian dengan nol
                                change_percent = ((close_value - prev_close) / prev_close * 100)
                                
                                # Tambahkan nilai saham dan persentase perubahan ke sektor
                                sector_map[sector_name]['stockCount'] += 1
                                sector_map[sector_name]['totalValue'] += close_value
                                sector_map[sector_name]['totalChangePercent'] += change_percent
                
                # Konversi map menjadi list dan hitung rata-rata
                result = []
                for sector_name, data in sector_map.items():
                    if data['stockCount'] > 0:
                        avg_value = data['totalValue'] / data['stockCount']
                        avg_change = data['totalChangePercent'] / data['stockCount']
                        
                        # Map nama sektor bahasa Inggris ke bahasa Indonesia
                        indo_name = sector_name
                        if sector_name == "Financial Services":
                            indo_name = "Keuangan"
                        elif sector_name == "Consumer Defensive":
                            indo_name = "Konsumer"
                        elif sector_name == "Basic Materials":
                            indo_name = "Material Dasar"
                        elif sector_name == "Energy":
                            indo_name = "Energi"
                        elif sector_name == "Industrials":
                            indo_name = "Industri"
                        elif sector_name == "Utilities":
                            indo_name = "Utilitas"
                        elif sector_name == "Healthcare":
                            indo_name = "Kesehatan"
                        elif sector_name == "Technology":
                            indo_name = "Teknologi"
                        elif sector_name == "Real Estate":
                            indo_name = "Properti"
                        
                        result.append({
                            "name": indo_name,
                            "value": round(avg_value, 2),
                            "changePercent": round(avg_change, 2)
                        })
                  # Jika tidak ada data sektor
                if not result:
                    return jsonify({'status': 'error', 'message': f'Tidak ada data sektor tersedia dari collection yfinance_data'}), 404
                
                return jsonify(result)
            except Exception as e:
                print(f"Error processing sector data: {str(e)}")
                return jsonify({'status': 'error', 'message': f'Error processing sector data: {str(e)}'}), 500
            
        elif data_type == 'commodities':
            # Coba ambil data komoditas dari database
            commodities = [
                {"name": "Minyak Mentah", "symbol": "CL=F"},
                {"name": "Emas", "symbol": "GC=F"},
                {"name": "CPO", "symbol": "CPO=F"},
                {"name": "Batubara", "symbol": "MTF=F"}
            ]
            
            result = []
            # Logika untuk mengambil data komoditas dari database
            # Tetapi untuk sekarang, kita akan mengembalikan error karena tidak ada data dummy
            return jsonify({'status': 'error', 'message': f'Data komoditas tidak tersedia dari collection yfinance_data'}), 404
            
        elif data_type == 'forex':
            # Coba ambil data forex dari database
            forex_pairs = [
                {"name": "USD/IDR", "symbol": "USD/IDR=X"},
                {"name": "EUR/IDR", "symbol": "EUR/IDR=X"},
                {"name": "JPY/IDR", "symbol": "JPY/IDR=X"},
                {"name": "SGD/IDR", "symbol": "SGD/IDR=X"}
            ]
            
            result = []
            # Logika untuk mengambil data forex dari database
            # Tetapi untuk sekarang, kita akan mengembalikan error karena tidak ada data dummy
            return jsonify({'status': 'error', 'message': f'Data forex tidak tersedia dari collection yfinance_data'}), 404
        else:
            return jsonify({"error": "Tipe data tidak valid"}), 400
        
        # This line won't be reached due to early returns above
        # But kept for logical completeness
        return jsonify(result)
    except Exception as e:
        print(f"Error in market overview: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/iqplus/recent')
def get_recent_news():
    """Endpoint untuk berita terbaru (default: 24 jam terakhir)"""
    try:
        hours = int(request.args.get('hours', 24))
        time_threshold = datetime.now() - timedelta(hours=hours)
        
        recent_news = list(iqplus_collection.find({
            "date": {
                "$gte": time_threshold.strftime("%d/%m/%Y %H:%M")
            }
        }))
        
        return jsonify({
            'status': 'success',
            'data': parse_json(recent_news),
            'count': len(recent_news)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/iqplus/emiten/<emiten_code>')
def get_news_by_emiten(emiten_code):
    """Endpoint untuk berita berdasarkan kode emiten"""
    try:
        emiten_news = list(iqplus_collection.find({
            "emiten": emiten_code.upper()
        }))
        
        return jsonify({
            'status': 'success',
            'data': parse_json(emiten_news),
            'count': len(emiten_news)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
