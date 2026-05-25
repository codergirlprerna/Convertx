import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg = null;
let ffmpegLoaded = false;
let ffmpegLoading = false;

async function getFFmpeg(onProgress) {
  if (ffmpegLoaded) return ffmpeg;

  if (ffmpegLoading) {
    await new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (ffmpegLoaded) { clearInterval(interval); resolve(); }
        if (!ffmpegLoading) { clearInterval(interval); reject(new Error("FFmpeg load failed")); }
        if (Date.now() - start > 60000) { clearInterval(interval); reject(new Error("FFmpeg load timed out")); }
      }, 200);
    });
    return ffmpeg;
  }

  ffmpegLoading = true;
  ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    if (onProgress) onProgress(Math.round(progress * 100));
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm";

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegLoaded = true;
    ffmpegLoading = false;
    return ffmpeg;
  } catch (err) {
    // Reset state so user can retry
    ffmpegLoaded = false;
    ffmpegLoading = false;
    ffmpeg = null;
    throw new Error("Failed to load video converter. Check your internet connection and try again.");
  }
}

const FORMAT_ARGS = {
  MP3: { ext: "mp3", args: ["-c:a", "libmp3lame", "-q:a", "2"] },
  WAV: { ext: "wav", args: ["-c:a", "pcm_s16le"] },
  OGG: { ext: "ogg", args: ["-c:a", "libvorbis", "-q:a", "4"] },
  AAC: { ext: "aac", args: ["-c:a", "aac", "-b:a", "192k"] },
  MP4: { ext: "mp4", args: ["-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart"] },
  WEBM: { ext: "webm", args: ["-c:v", "libvpx-vp9", "-c:a", "libopus"] },
  MP3_FROM_VIDEO: { ext: "mp3", args: ["-vn", "-c:a", "libmp3lame", "-q:a", "2"] },
  WAV_FROM_VIDEO: { ext: "wav", args: ["-vn", "-c:a", "pcm_s16le"] },
  OGG_FROM_VIDEO: { ext: "ogg", args: ["-vn", "-c:a", "libvorbis", "-q:a", "4"] },
  AAC_FROM_VIDEO: { ext: "aac", args: ["-vn", "-c:a", "aac", "-b:a", "192k"] },
  GIF: { ext: "gif", args: ["-vf", "fps=10,scale=480:-1:flags=lanczos", "-loop", "0"] },
};

export async function convertMedia(file, targetFmt, onProgress) {
  const isVideoToAudio =
    file.type.startsWith("video/") && ["MP3", "WAV", "OGG", "AAC"].includes(targetFmt);

  const formatKey = isVideoToAudio ? `${targetFmt}_FROM_VIDEO` : targetFmt;
  const config = FORMAT_ARGS[formatKey] || FORMAT_ARGS[targetFmt];

  if (!config) throw new Error(`Unsupported conversion: ${targetFmt}`);

  onProgress?.(5);
  const ff = await getFFmpeg(onProgress);
  onProgress?.(20);

  const inputExt = file.name.split(".").pop().toLowerCase();
  const inputName = `input.${inputExt}`;
  const outputName = `output.${config.ext}`;

  try {
    await ff.writeFile(inputName, await fetchFile(file));
    onProgress?.(35);

    await ff.exec(["-i", inputName, ...config.args, outputName]);
    onProgress?.(85);

    const data = await ff.readFile(outputName);
    onProgress?.(95);

    // Cleanup virtual FS
    try { await ff.deleteFile(inputName); } catch {}
    try { await ff.deleteFile(outputName); } catch {}

    const mimeMap = {
      mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
      aac: "audio/aac", mp4: "video/mp4", webm: "video/webm", gif: "image/gif",
    };

    const blob = new Blob([data.buffer], { type: mimeMap[config.ext] || "application/octet-stream" });
    return { blob, ext: config.ext };

  } catch (err) {
    // Cleanup on error
    try { await ff.deleteFile(inputName); } catch {}
    try { await ff.deleteFile(outputName); } catch {}
    throw new Error(err.message || "Conversion failed. Please try again.");
  }
}