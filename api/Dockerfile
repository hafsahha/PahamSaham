FROM python:3.9-slim

# Install OpenJDK 17 (yang tersedia di Debian Bookworm)
RUN apt-get update && apt-get install -y openjdk-17-jre-headless && \
    apt-get clean

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Buat direktori aplikasi
WORKDIR /app

# Install dependencies Python
COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# Salin aplikasi
COPY . .

# Expose port Flask
EXPOSE 5000

# Jalankan aplikasi
CMD ["python", "api_aggregate.py"]