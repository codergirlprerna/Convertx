# ⚡ ConvertX

> Convert any file to any format — instantly, privately, in your browser.

No uploads. No servers. No data ever leaves your device.

---

## What it does

ConvertX is a fully browser-based file converter. Everything runs locally using Web APIs and WebAssembly — zero backend required.

| Type | Input | Output |
|---|---|---|
| 🖼 Image | PNG, JPG, JPEG, WEBP, GIF, BMP, SVG | PNG, JPEG, WEBP, GIF, BMP |
| 🎵 Audio | MP3, WAV, OGG, FLAC, AAC, M4A | MP3, WAV, OGG, AAC |
| 🎬 Video | MP4, WEBM, AVI, MOV, MKV | MP4, WEBM, MP3, GIF |
| 📄 Document | TXT, HTML, CSV, JSON, MD, PDF | TXT, HTML, JSON, CSV, Markdown |

---

## Tech stack

- **React + Vite** — frontend
- **Canvas API** — image conversion
- **ffmpeg.wasm** — real audio/video transcoding in the browser
- **Browser File API** — document conversion
- **localStorage** — persistent conversion history

---

## Run locally

```bash
# Clone or unzip the project
cd convertx

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

The included `vercel.json` sets the required `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers so ffmpeg.wasm works correctly in production.

---

## Notes

- Audio/video conversion uses **ffmpeg.wasm** (~30MB, downloaded once on first use)
- Animated GIFs can be created from video files (MP4 → GIF)
- PNG/JPG → GIF produces a static GIF (no animation from still images)
- Conversion history is saved in `localStorage` and persists across sessions
- Download links are session-only — refresh the page and re-convert to download again

---

Built with React + Vite. No backend. No tracking. No cost.