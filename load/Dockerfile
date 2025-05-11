FROM python:3.9-slim

# Set working directory in the container
WORKDIR /app/load

# Copy requirements file and install dependencies
COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# Copy load scripts
COPY yfinance_load.py . 
COPY idx_load.py . 

# Set environment variables (can be overridden at runtime)
ENV YFINANCE_INPUT_PATH=/app/output/yfinance_output.json
ENV IDX_INPUT_PATH=/app/output/idx_output.json
ENV MONGO_URI="mongodb+srv://coffeelatte:secretdata3@luna.sryzase.mongodb.net/"
ENV MONGO_DB="bigdata_saham"
ENV MONGO_COLLECTION="yfinance_data_test"

# Run the script based on the TASK environment variable
CMD ["sh", "-c", "if [ \"$TASK\" = \"idx\" ]; then python idx_load.py; else python yfinance_load.py; fi"]
