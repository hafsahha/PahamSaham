#!/bin/bash
ollama serve &
OLLAMA_PID=$!
echo "Waiting for Ollama server to start..."
TIMEOUT=60
ELAPSED=0
until curl -s http://localhost:11434 > /dev/null; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Error: Ollama server did not start within $TIMEOUT seconds"
    kill $OLLAMA_PID
    exit 1
  fi
  echo "Ollama server not ready, retrying in 5 seconds..."
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done
echo "Ollama server is ready!"
echo "Pulling phi3 model..."
ollama pull phi3 || {
  echo "Error: Failed to pull phi3 model"
  kill $OLLAMA_PID
  exit 1
}
wait $OLLAMA_PID