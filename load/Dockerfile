FROM python:3.9-slim

# Set working directory in the container
WORKDIR /app/load

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY yfinance_load.py .

# Set environment variables (can be overridden at runtime)
ENV YFINANCE_INPUT_PATH=../output/yfinance_output.json
ENV MONGO_URI="mongodb+srv://coffeelatte:secretdata3@luna.sryzase.mongodb.net/"
ENV MONGO_DB="bigdata_saham"
ENV MONGO_COLLECTION="yfinance_data_testt"

# Run the script when the container launches
CMD ["python", "yfinance_load.py"]