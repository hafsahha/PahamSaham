FROM python:3.11

# Install system dependencies with optimization
RUN apt-get update && apt-get install -y \
    wget curl unzip gnupg \
    fonts-liberation libnss3 libatk-bridge2.0-0 \
    libgtk-3-0 libx11-xcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxrandr2 \
    libgbm1 libasound2 libgl1-mesa-glx \
    libdrm2 xdg-utils xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/googlechrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Setup working directory with proper permissions
WORKDIR /app
RUN chmod -R 777 /app

# Create necessary directories with proper permissions
RUN mkdir -p /app/extract/idx_zip /app/extract/idx_extracted /app/output \
    && chmod -R 777 /app/extract/idx_zip \
    && chmod -R 777 /app/extract/idx_extracted \
    && chmod -R 777 /app/output

# Copy requirements first for caching
COPY ./extract/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --upgrade selenium webdriver-manager

# Copy application files
COPY ./extract/idx_extract.py .
COPY ./extract/yfinance_extract.py .
COPY ./extract/iqplus_extract.py .

# Set permissions
RUN chmod +x idx_extract.py
RUN chmod +x yfinance_extract.py
RUN chmod +x iqplus_extract.py

# Environment variables
ENV YFINANCE_OUTPUT_PATH=/app/output/yfinance_output.json
ENV IDX_OUTPUT_PATH=/app/output/idx_extract.json
ENV IQPLUS_OUTPUT_PATH=/app/output/iqplus_output.json

ENV zip_downloaded_path=/output/idx_zip
ENV zip_extracted_path=/output/idx_extracted

# Default command
CMD ["python", "idx_extract.py"]