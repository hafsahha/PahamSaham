FROM python:3.9-slim

# Set working directory in the container
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the MongoDB load script
COPY load_mongodb.py .

# Create directory for input files
RUN mkdir -p /tmp

# Set environment variables (can be overridden at runtime)
ENV YFINANCE_INPUT_PATH=/tmp/yfinance_daily_data.json
ENV MONGO_URI="mongodb+srv://coffeelatte:secretdata3@luna.sryzase.mongodb.net/"
ENV MONGO_DB="bigdata_saham"
ENV MONGO_COLLECTION="yfinance_data"

# Run the script when the container launches
CMD ["python", "load_mongodb.py"]