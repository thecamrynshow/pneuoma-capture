#!/bin/bash
set -e

echo "Waiting for network connectivity..."
until python3 -c "import urllib.request; urllib.request.urlopen('https://huggingface.co', timeout=5)" 2>/dev/null; do
    echo "  Network not ready, retrying in 3s..."
    sleep 3
done
echo "Network is ready."

echo "Starting vLLM server..."
vllm serve "${LLM_MODEL:-Qwen/Qwen2.5-7B-Instruct}" \
    --port 8001 \
    --max-model-len 4096 \
    --max-num-seqs 64 \
    --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION:-0.8}" &

echo "Waiting for vLLM to be ready..."
until curl -sf http://localhost:8001/health > /dev/null 2>&1; do
    sleep 2
done
echo "vLLM is ready."

echo "Starting PNEUOMA AI API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
