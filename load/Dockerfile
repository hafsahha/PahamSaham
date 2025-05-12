FROM python:3.9-slim

# Set working directory in the container
WORKDIR /app/load

# Copy requirements file and install dependencies
COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# Copy load scripts
COPY loader.py . 
COPY yfinance_loader.py .

# Set environment variables
ENV MONGO_URI="mongodb+srv://coffeelatte:secretdata3@luna.sryzase.mongodb.net/"
ENV MONGO_DB="bigdata_saham"

# Run the script
CMD ["python", "yfinance_loader.py"]
# CMD ["python", "loader.py"]
