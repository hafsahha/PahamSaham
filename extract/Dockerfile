FROM python:3.9-slim

# Set working directory in the container
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the extraction script
COPY yfinance_extract.py .

# Create directory for output
RUN mkdir -p /tmp

# Set environment variables (can be overridden at runtime)
ENV YFINANCE_OUTPUT_PATH=/tmp/yfinance_daily_data.json

# Run the script when the container launches
CMD ["python", "yfinance_extract.py"]