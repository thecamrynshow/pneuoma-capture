FROM vllm/vllm-openai:latest

RUN pip install --no-cache-dir \
    faster-whisper>=1.1.0 \
    python-multipart>=0.0.18

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x start.sh

EXPOSE 8000

ENTRYPOINT []
CMD ["/bin/bash", "./start.sh"]
