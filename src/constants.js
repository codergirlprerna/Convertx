export const FORMAT_MAP = {
  image: {
    label: "Image",
    icon: "🖼",
    color: "#00d4aa",
    accepts: [
      "image/png", "image/jpeg", "image/webp",
      "image/gif", "image/bmp", "image/tiff", "image/svg+xml",
    ],
    exts: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg"],
    outputs: ["PNG", "JPEG", "WEBP", "GIF", "BMP"],
  },
  audio: {
    label: "Audio",
    icon: "🎵",
    color: "#f59e0b",
    accepts: [
      "audio/mpeg", "audio/wav", "audio/ogg",
      "audio/flac", "audio/aac", "audio/mp4", "audio/x-m4a",
    ],
    exts: ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
    outputs: ["MP3", "WAV", "OGG", "AAC"],
  },
  video: {
    label: "Video",
    icon: "🎬",
    color: "#f43f5e",
    accepts: [
      "video/mp4", "video/webm", "video/ogg",
      "video/x-msvideo", "video/quicktime", "video/x-matroska",
    ],
    exts: ["mp4", "webm", "ogg", "avi", "mov", "mkv"],
    outputs: ["MP4", "WEBM", "MP3", "GIF"],
  },
  document: {
    label: "Document",
    icon: "📄",
    color: "#818cf8",
    accepts: [
      "application/pdf", "text/plain", "text/html",
      "text/csv", "application/json", "text/markdown",
    ],
    exts: ["pdf", "txt", "html", "csv", "json", "md"],
    outputs: ["TXT", "HTML", "JSON", "CSV", "MARKDOWN"],
  },
};

export const HISTORY_KEY = "convertx_history_v1";
export const MAX_HISTORY = 50;
