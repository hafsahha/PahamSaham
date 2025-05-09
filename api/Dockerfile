# Gunakan Python image resmi
FROM python:3.9-slim

# Install Java (untuk Spark)
RUN apt-get update && apt-get install -y openjdk-11-jdk && apt-get clean

# Set environment variable untuk Java
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64

# Buat direktori kerja
WORKDIR /app

# Salin file requirements dan install dependensi
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh isi folder api ke container
COPY . .

# Jalankan API Flask
CMD ["python", "app.py"]