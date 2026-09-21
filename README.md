# YouTube Downloader

A web-based application for downloading YouTube audio and video streams, built with FastAPI, yt-dlp, React, and Docker.

---

## Overview

YouTube Downloader provides a clean, self-hosted interface for fetching YouTube media. The application supports video extraction with resolution selection up to 1080p and high-bitrate audio extraction in MP3 format, complete with real-time download and conversion progress tracking.

---

## Features

- **Format Selection**: Support for MP4 video (up to 1080p) and MP3 audio extraction.
- **Real-Time Progress Tracking**: Live monitoring of download percentage, transfer speed, and estimated time of arrival (ETA).
- **Metadata Inspection**: Automatically fetches title, thumbnail, duration, and uploader information before initiating downloads.
- **Containerized Architecture**: Single multi-stage Docker image packaging both the FastAPI backend and built React frontend.
- **Lightweight & Self-Hostable**: Optimized for low resource consumption, suitable for home servers and VPS environments.

---

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ASGI Server**: Uvicorn
- **Media Processing**: `yt-dlp`, FFmpeg
- **Validation**: Pydantic

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

### Infrastructure
- **Containerization**: Docker, Docker Compose

---

## Project Structure

```text
.
├── Dockerfile                  # Production container definition
├── README.md                   # Project documentation
├── backend/
│   ├── main.py                 # FastAPI application entrypoint
│   ├── static/                 # Production-built frontend assets
│   └── downloads/              # Temporary download directory
└── frontend/
    ├── src/                    # React application source code
    ├── package.json            # Node.js dependencies
    └── vite.config.js          # Vite configuration
```

---

## Deployment

### Using Docker Compose (Recommended)

1. Create or verify your `docker-compose.yml`:
   ```yaml
   services:
     yt-downloader:
       build: .
       container_name: yt-downloader
       restart: always
       ports:
         - "8001:8001"
       volumes:
         - ./downloads:/app/downloads
   ```

2. Build and run the container:
   ```bash
   docker compose up -d --build
   ```

3. Access the web interface at `http://localhost:8001`.

---

## Local Development Setup

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install fastapi uvicorn yt-dlp pydantic
   ```

4. Start the development server:
   ```bash
   python main.py
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. To build for production and serve via FastAPI:
   ```bash
   npm run build
   cp -r dist/* ../backend/static/
   ```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/info?url={url}` | Fetches video metadata (title, duration, thumbnail, uploader) |
| `POST` | `/api/download` | Initiates asynchronous media download |
| `GET` | `/api/progress/{task_id}` | Retrieves real-time task progress |
| `GET` | `/api/file/{task_id}` | Streams the completed media file to client |

---

## Disclaimer

This software is intended for personal and educational use only. Please respect copyright laws and the terms of service of the content platforms you interact with.

---

## License

This project is licensed under the MIT License.
