FROM python:3.12-slim

# Install ffmpeg, nodejs (JS runtime required by modern yt-dlp for YouTube cipher & bot-bypass) & dependencies
RUN apt-get update && apt-get install -y ffmpeg nodejs && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files (termasuk static frontend yang udah kita build)
COPY backend/ /app/

# Install python packages & ensure latest yt-dlp
RUN pip install --no-cache-dir -U fastapi uvicorn yt-dlp pydantic

EXPOSE 8001

CMD ["python", "main.py"]
