import React, { useState } from 'react';
import axios from 'axios';
import { Music, Video, Link as LinkIcon, Loader2, AlertCircle, Sparkles, Search, Monitor, Globe } from 'lucide-react';

const API_BASE = "/api";

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [resolution, setResolution] = useState('1080');

  const handleAction = async () => {
    if (!query) return;
    setLoading(true);
    setError('');
    setInfo(null);
    setResults([]);

    try {
      if (query.startsWith('http')) {
        const res = await axios.get(`${API_BASE}/info?url=${encodeURIComponent(query)}`);
        setInfo(res.data);
      } else {
        const res = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        if (res.data.length === 0) setError("Media tidak ditemukan.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memproses permintaan server.");
    } finally {
      setLoading(false);
    }
  };

  const selectVideo = (video) => {
    setInfo({
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      uploader: video.uploader,
      extractor: "youtube",
      url: video.url
    });
    setResults([]);
  };

  const handleDownload = async (format) => {
    setError('');
    setProgress({ status: "starting", percent: 0 });
    try {
      const res = await axios.post(`${API_BASE}/download`, { url: info.url, format, resolution });
      const { task_id } = res.data;
      
      const eventSource = new EventSource(`${API_BASE}/progress/${task_id}`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress(data);
        if (data.status === 'complete') {
          eventSource.close();
          // Di-disable agar tidak mendownload ke browser lokal, melainkan tetap tersimpan di server
          // window.location.href = `${API_BASE}/file/${task_id}`;
          setTimeout(() => setProgress(null), 2000);
        }
        if (data.status === 'error') {
          eventSource.close();
          setError("Gagal: " + data.detail);
          setProgress(null);
        }
      };
    } catch (err) {
      setError("Gagal memulai proses unduhan.");
      setProgress(null);
    }
  };

  return (
    <div className="bg-[#0b0f1a] text-slate-300 min-h-screen font-sans">
      <nav className="max-w-6xl mx-auto px-6 py-10 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/10">
            <Globe className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white italic">MECTOV<span className="text-indigo-500 not-italic font-black ml-0.5">X</span></span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pb-24">
        {/* Professional Hero Section */}
        <div className="mb-16 text-left border-l-2 border-indigo-500/50 pl-8 ml-2">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
            High-Performance <br />
            Media Downloader.
          </h1>
          <p className="text-slate-500 text-base max-w-lg font-medium">
            Layanan ekstraksi media digital terenkripsi untuk kebutuhan arsip pribadi Anda.
          </p>
        </div>

        {/* Input Section with Label */}
        <div className="mb-12">
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-2">
            Pencarian & Tautan Media
          </label>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 ring-1 ring-white/5 focus-within:ring-indigo-500/30 transition-all">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 text-slate-600 w-5 h-5" />
              <input
                type="text"
                placeholder="Masukkan judul atau URL video..."
                className="w-full bg-transparent border-none py-3.5 pl-12 pr-4 focus:ring-0 text-white placeholder:text-slate-600 text-base"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAction()}
              />
            </div>
            <button
              onClick={handleAction}
              disabled={loading || !query}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-12 py-3.5 rounded-xl font-bold text-white text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Kirim"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-10 p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm font-medium italic">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && !progress && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {results.map((v, i) => (
              <div 
                key={i} 
                onClick={() => selectVideo(v)}
                className="group bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all duration-300"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={v.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 border border-white/5">
                    {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-200 line-clamp-2 leading-snug mb-2 text-sm transition-colors group-hover:text-indigo-400">{v.title}</h3>
                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">{v.uploader}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Video */}
        {info && !progress && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
            <img src={info.thumbnail} className="w-full h-80 object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
            <div className="p-10">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 block">{info.extractor} source</span>
              <h2 className="text-2xl font-bold text-white mb-3 leading-tight tracking-tight">{info.title}</h2>
              <p className="text-slate-500 mb-10 text-sm font-medium italic">Dipublikasikan oleh {info.uploader}</p>
              
              <div className="mb-10 p-5 bg-black/20 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Kualitas Output</p>
                </div>
                <div className="flex gap-2">
                  {['360', '720', '1080'].map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                        resolution === res 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {res}P
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleDownload('mp3')}
                  className="flex-1 flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 py-4.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.1em] text-white border border-slate-700 transition-all"
                >
                  <Music className="w-4 h-4" /> Audio MP3
                </button>
                <button
                  onClick={() => handleDownload('mp4')}
                  className="flex-[2] flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 py-4.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.1em] text-white shadow-xl shadow-indigo-600/10 transition-all"
                >
                  <Video className="w-4 h-4" /> Unduh Video
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        {progress && (
          <div className="bg-slate-950 border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 mx-auto border border-indigo-500/20">
              <Loader2 className="animate-spin w-7 h-7 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Sedang Mengunduh</h3>
            <p className="text-slate-500 text-xs font-medium mb-10 italic tracking-wide">Server sedang melakukan ekstraksi media...</p>

            <div className="w-full">
              <div className="flex justify-between text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3 opacity-80">
                <span>PROGRESS</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-8 text-left border-t border-slate-900 pt-8">
                <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Speed</p>
                  <p className="text-sm font-mono font-bold text-slate-300 tracking-tighter">{progress.speed || '--'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Est. Time</p>
                  <p className="text-sm font-mono font-bold text-slate-300 tracking-tighter">{progress.eta || '--'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-12 border-t border-slate-900/50">
        <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.5em] mb-2">MectovX Systems &bull; Private Repository</p>
        <div className="flex justify-center gap-4 text-slate-800">
           <Globe className="w-3 h-3" />
           <Monitor className="w-3 h-3" />
        </div>
      </footer>
    </div>
  );
}

export default App;
