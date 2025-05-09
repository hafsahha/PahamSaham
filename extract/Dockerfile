FROM python:3.11

# Install system dependencies with cleanup
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    gnupg \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome (latest stable version) with proper keyring setup
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

# Setup working directory structure
WORKDIR /app
RUN mkdir -p \
    /app/output \
    /app/extract/idx_zip \
    /app/extract/idx_extracted \
    /app/extract/logs

# Copy requirements first for layer caching
COPY ./extract/requirements.txt /app/extract/

# Install Python dependencies
RUN pip install --no-cache-dir \
    -r /app/extract/requirements.txt \
    webdriver-manager

# Copy application files
COPY ./extract/idx_extract.py /app/extract/
COPY ./extract/yfinance_extract.py /app/extract/ 

# Set permissions and working directory
RUN chmod +x /app/extract/idx_extract.py && \
    chmod +x /app/extract/yfinance_extract.py 

WORKDIR /app/extract

# Environment variables
ENV YFINANCE_OUTPUT_PATH=/app/output/yfinance_output.json
ENV IDX_OUTPUT_PATH=/app/output/idx_extract.json
ENV IQPLUS_OUTPUT_PATH=/app/output/iqplus_output.json
ENV PYTHONPATH=/app

# Default command
CMD ["python", "idx_extract.py"]