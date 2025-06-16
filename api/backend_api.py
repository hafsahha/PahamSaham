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

    df = load_data(emiten)
    if not df or df.count() == 0:
        return jsonify({"error": "Data tidak ditemukan"}), 404

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
