# YouTube Downloader

A lightweight, modern web-based YouTube audio & video downloader built with **FastAPI** (Python + `yt-dlp`), **React** (Vite + Tailwind CSS), and Docker.

---

## 🚀 Features

- 🎥 Download video with resolution selection up to 1080p
- 🎵 Extract and download audio in MP3 format with high quality
- ⚡ Real-time progress bar with speed, percentage, and ETA
- 🐳 Fully dockerized (single lightweight container serving both frontend & backend)
- 🔒 Secure & self-hostable

---

## 🛠️ Tech Stack

- **Backend:** Python 3.12, FastAPI, Uvicorn, yt-dlp, FFmpeg
- **Frontend:** React 19, Vite, Tailwind CSS
- **Containerization:** Docker

---

## 🏃 Getting Started

### Using Docker (Recommended)

1. **Build and run with Docker Compose:**
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

2. **Run container:**
   ```bash
   docker compose up -d --build
   ```

3. Open your browser and access `http://localhost:8001`.

---

### Manual Setup

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn yt-dlp pydantic
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run build
```

Copy the contents of `frontend/dist` to `backend/static/` to serve them from FastAPI.

---

## 📄 License

MIT License.
