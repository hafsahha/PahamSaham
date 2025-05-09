FROM python:3.11

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all extractor scripts
COPY yfinance_extract.py .
# COPY idx_extract.py .
# COPY iqplus_extract.py .

# Buat folder output
RUN mkdir -p ../output

# Default environment variables (bisa dioverride saat run)
ENV YFINANCE_OUTPUT_PATH=../output/yfinance_output.json
ENV IDX_OUTPUT_PATH=../output/idx_output.json
ENV IQPLUS_OUTPUT_PATH=../output/iqplus_output.json

# Default command — bisa diubah saat docker run
CMD ["python", "yfinance_extract.py"]