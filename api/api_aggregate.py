from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date, date_format, avg
import os

# === Inisialisasi Flask ===
app = Flask(__name__)
CORS(app)

# === Koneksi MongoDB Atlas ===
client = MongoClient("mongodb+srv://coffeelatte:secretdata3@luna.sryzase.mongodb.net/")
db = client["bigdata_saham"]
collection = db["yfinance_data"]

# === Set JAVA_HOME untuk Spark ===
os.environ["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"

# === Inisialisasi SparkSession ===
spark = SparkSession.builder \
    .appName("SahamApp") \
    .config("spark.ui.port", "4050") \
    .getOrCreate()

def safe_float(value):
    try:
        return float(value) if value is not None and value != "" else 0.0
    except (ValueError, TypeError):
        return 0.0

def safe_int(value):
    try:
        return int(value) if value is not None and value != "" else 0
    except (ValueError, TypeError):
        return 0

# === Fungsi Load dan Siapkan Data ===
def load_data(emiten):
    raw = list(collection.find({
        "info.symbol": { "$regex": f"^{emiten}$", "$options": "i" }
    }))
    if not raw:
        print("❌ Tidak ada data ditemukan untuk", emiten)
        return None

    doc = raw[0]
    symbol = doc.get('info', {}).get('symbol', emiten)
    history = doc.get('history', [])
    data = []

    for record in history:
        try:
            data.append({
                "symbol": symbol,
                "Date": str(record.get("Date", "")).split("T")[0],
                "Open": safe_float(record.get("Open")),
                "High": safe_float(record.get("High")),
                "Low": safe_float(record.get("Low")),
                "Close": safe_float(record.get("Close")),
                "Volume": float(safe_int(record.get("Volume")))
            })
        except Exception as e:
            print(f"⚠️ Skip record rusak: {e}")

    if not data:
        print("❌ Semua record history kosong atau rusak.")
        return None

    from pyspark.sql.types import StructType, StructField, StringType, DoubleType
    schema = StructType([
        StructField("symbol", StringType(), True),
        StructField("Date", StringType(), True),
        StructField("Open", DoubleType(), True),
        StructField("High", DoubleType(), True),
        StructField("Low", DoubleType(), True),
        StructField("Close", DoubleType(), True),
        StructField("Volume", DoubleType(), True),
    ])

    try:
        df = spark.createDataFrame(data, schema=schema)
        df = df.withColumn("Date", to_date("Date"))
        return df
    except Exception as e:
        print("❌ Gagal membuat Spark DataFrame:", e)
        return None

# === Endpoint: Daftar Emiten ===
@app.route("/api/emiten")
def get_emiten():
    symbols = collection.distinct("info.symbol")
    return jsonify(symbols)

# === Endpoint: Harga Saham Berdasarkan Periode ===
@app.route("/api/harga")
def get_harga():
    emiten = request.args.get("emiten")
    period = request.args.get("period", "daily")

    if not emiten:
        return jsonify({"error": "Parameter 'emiten' wajib diisi"}), 400

    if period not in ["daily", "monthly", "yearly"]:
        return jsonify({"error": "Parameter 'period' harus daily/monthly/yearly"}), 400

    df = load_data(emiten)
    if df is None or df.count() == 0:
        return jsonify({"error": "Data tidak ditemukan atau kosong"}), 404

    try:
        if period == "monthly":
            df = df.withColumn("period", date_format("Date", "yyyy-MM"))
        elif period == "yearly":
            df = df.withColumn("period", date_format("Date", "yyyy"))
        else:
            df = df.withColumn("period", col("Date"))

        agg_df = df.groupBy("period").agg(
            avg("Open").alias("Open"),
            avg("High").alias("High"),
            avg("Low").alias("Low"),
            avg("Close").alias("Close"),
            avg("Volume").alias("Volume")
        ).orderBy("period")

        result = []
        for row in agg_df.collect():
            if row["Open"] is not None:
                result.append({
                    "Symbol": emiten.upper(),
                    "Date": str(row["period"]),
                    "Open": round(row["Open"], 2),
                    "High": round(row["High"], 2),
                    "Low": round(row["Low"], 2),
                    "Close": round(row["Close"], 2),
                    "Volume": int(row["Volume"]) if row["Volume"] is not None else 0
                })

        return jsonify(result)

    except Exception as e:
        print("❌ Gagal proses agregasi:", e)
        return jsonify({"error": "Terjadi error saat agregasi data"}), 500

# === Jalankan Flask di 0.0.0.0 agar bisa diakses container/host ===
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)