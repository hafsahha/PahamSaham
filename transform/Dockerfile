FROM python:3.11

# Install OpenJDK 17 (yang tersedia di Debian Bookworm)
RUN apt-get update && apt-get install -y openjdk-17-jre-headless && \
    apt-get clean

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download semua JAR yang diperlukan
RUN mkdir -p /opt/spark/jars && \
    curl -o /opt/spark/jars/mongo-spark-connector_2.12-3.0.1.jar \
    https://repo1.maven.org/maven2/org/mongodb/spark/mongo-spark-connector_2.12/3.0.1/mongo-spark-connector_2.12-3.0.1.jar && \
    curl -o /opt/spark/jars/mongo-java-driver-3.12.13.jar \
    https://repo1.maven.org/maven2/org/mongodb/mongo-java-driver/3.12.13/mongo-java-driver-3.12.13.jar && \
    curl -o /opt/spark/jars/bson-3.12.13.jar \
    https://repo1.maven.org/maven2/org/mongodb/bson/3.12.13/bson-3.12.13.jar

COPY . /app
WORKDIR /app

# CMD ["python", "idx_transform.py"]