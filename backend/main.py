import os
import re
import asyncio
import time
import uuid
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

progress_db = {}

class DownloadRequest(BaseModel):
    url: str
    format: str
    resolution: str = "1080"

def progress_hook(d, task_id):
    if d['status'] == 'downloading':
        p = d.get('_percent_str', '0%').replace('%','').strip()
        speed = d.get('_speed_str', 'N/A')
        eta = d.get('_eta_str', 'N/A')
        if task_id in progress_db:
            progress_db[task_id].update({
                "status": "downloading",
                "percent": p,
                "speed": speed,
                "eta": eta
            })
    elif d['status'] == 'finished':
        if task_id in progress_db:
            progress_db[task_id].update({"status": "processing", "percent": "100"})

@app.get("/api/info")
async def get_video_info(url: str):
    ydl_opts = {
        'quiet': True,
        'noplaylist': True,
        'extractor_args': {'youtube': {'player_client': ['android', 'web', 'tv']}}
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            return {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "uploader": info.get('uploader'),
                "extractor": info.get('extractor'),
                "url": info.get('webpage_url')
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/download")
async def start_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    progress_db[task_id] = {"status": "starting", "percent": "0"}
    background_tasks.add_task(run_download, task_id, req.url, req.format, req.resolution)
    return {"task_id": task_id}

async def run_download(task_id, url, format_type, resolution):
    # Menggunakan judul video asli agar rapi di folder media Navidrome
    file_tmpl = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    
    # OPTIMASI: Tambah n_threads dan concurrent-fragments untuk kecepatan maksimal
    ydl_opts = {
        'outtmpl': file_tmpl,
        'noplaylist': True,
        'quiet': True,
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        'n_threads': 4,
        'extractor_args': {'youtube': {'player_client': ['android', 'web', 'tv']}},
    }
    
    if format_type == 'mp3':
        ydl_opts.update({
            'format': 'bestaudio/best',
            'writethumbnail': True,  # Download cover art
            'postprocessors': [
                {'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'},
                {'key': 'EmbedThumbnail'},  # Masukkan cover art ke dalam MP3
                {'key': 'FFmpegMetadata', 'add_metadata': True}
            ],
        })
    else:
        # OPTIMASI: Jangan paksa ext=mp4 di awal agar tidak kena throttle, biarkan ffmpeg gabungin ke mp4 di akhir
        res_filter = f"bestvideo[height<={resolution}]+bestaudio/best[height<={resolution}]/best"
        ydl_opts.update({
            'format': res_filter,
            'merge_output_format': 'mp4', # Paksa hasil akhir jadi mp4
            'postprocessors': [{'key': 'FFmpegMetadata', 'add_metadata': True}],
        })

    try:
        loop = asyncio.get_event_loop()
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        
        # Ekstrak informasi terlebih dahulu tanpa mendownload
        info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
        
        # Bersihkan judul dari teks sampah promosi (e.g. Official Video, Lyrics, dll)
        raw_title = info.get('title', '')
        cleaned_title = re.sub(
            r'(?i)\s*[\(\[][^\)\]]*(official|lyrics?|video|audio|hd|ft\.|feat\.|clip|hq)[^\)\]]*[\)\]]', 
            '', 
            raw_title
        ).strip()
        
        # Parse artis & judul secara cerdas
        if info.get('artist') and info.get('track'):
            # Jika trek resmi YouTube Music, gunakan metadata aslinya
            info['artist'] = info.get('artist')
            info['title'] = info.get('track')
        elif ' - ' in cleaned_title:
            artist, track = cleaned_title.split(' - ', 1)
            info['artist'] = artist.strip()
            info['title'] = track.strip()
        elif ' – ' in cleaned_title: # en-dash
            artist, track = cleaned_title.split(' – ', 1)
            info['artist'] = artist.strip()
            info['title'] = track.strip()
        else:
            info['artist'] = info.get('uploader', 'Unknown Artist').strip()
            info['title'] = cleaned_title
            
        # Bersihkan spasi ganda
        info['title'] = re.sub(r'\s+', ' ', info['title'])
        info['artist'] = re.sub(r'\s+', ' ', info['artist'])
        
        # Set nama album (supaya rapi di Navidrome)
        info['album'] = info.get('album') or info.get('uploader') or 'YouTube'
        
        # Jalankan pengunduhan & pemrosesan metadata
        await loop.run_in_executor(None, lambda: ydl.process_info(info))
        filename = ydl.prepare_filename(info)
        
        # Karena kita pake merge_output_format, ext-nya bakal mp4
        if format_type != 'mp3':
            filename = os.path.splitext(filename)[0] + ".mp4"
        else:
            filename = os.path.splitext(filename)[0] + ".mp3"
        
        progress_db[task_id].update({
            "status": "complete", 
            "percent": "100", 
            "file": os.path.basename(filename),
            "original_name": info.get('title', 'video')
        })
    except Exception as e:
        if task_id in progress_db:
            progress_db[task_id].update({"status": "error", "detail": str(e)})

@app.get("/api/progress/{task_id}")
async def get_progress(task_id: str):
    async def event_generator():
        while True:
            data = progress_db.get(task_id, {"status": "waiting"})
            yield f"data: {json.dumps(data)}\n\n"
            if data['status'] in ['complete', 'error']:
                break
            await asyncio.sleep(0.5)
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})

@app.get("/api/file/{task_id}")
async def get_file(task_id: str):
    data = progress_db.get(task_id)
    if not data or 'file' not in data:
        raise HTTPException(status_code=404, detail="File info ilang.")
    
    file_path = os.path.join(DOWNLOAD_DIR, data['file'])
    if os.path.exists(file_path):
        clean_name = data.get('original_name', 'video').replace('"', '').replace('/', '_')
        extension = os.path.splitext(data['file'])[1]
        display_name = f"{clean_name}{extension}"
        return FileResponse(file_path, media_type='application/octet-stream', filename=display_name)
    raise HTTPException(status_code=404, detail="File udah kadaluarsa.")

if os.path.exists(os.path.join(os.path.dirname(__file__), "static")):
    app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static"), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
