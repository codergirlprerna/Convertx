import { useState } from "react";
import { FORMAT_MAP } from "../constants";

function Preview({ item }) {
  const { downloadUrl, downloadName, type } = item;
  if (!downloadUrl) return null;

  const ext = downloadName?.split(".").pop()?.toLowerCase();
  const isImage = ["png","jpg","jpeg","webp","gif","bmp"].includes(ext);
  const isAudio = ["mp3","wav","ogg","aac","flac"].includes(ext);
  const isVideo = ["mp4","webm","ogg"].includes(ext);
  const isText  = ["txt","html","json","csv","md"].includes(ext);

  if (isImage) {
    const isStaticGif = ext === "gif" && type === "image";
    return (
      <div>
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", maxHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={downloadUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain", display: "block" }} />
        </div>
        {isStaticGif && (
          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 11.5, color: "#f59e0b", fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 2 }}>Static GIF</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                This GIF has no animation because the source was a still image. To get an <strong style={{ color: "#f59e0b" }}>animated GIF</strong>, upload a video file (MP4, WEBM, MOV) and convert it to GIF.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isAudio) {
    return (
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <div style={{ fontSize: 11, color: "#f59e0b", fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 8 }}>🎵 Audio Preview</div>
        <audio controls style={{ width: "100%", height: 36 }} src={downloadUrl} />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(244,63,94,0.2)", background: "#000" }}>
        <div style={{ fontSize: 11, color: "#f43f5e", fontFamily: "var(--font-heading)", fontWeight: 600, padding: "8px 12px" }}>🎬 Video Preview</div>
        <video controls style={{ width: "100%", maxHeight: 220, display: "block" }} src={downloadUrl} />
      </div>
    );
  }

  if (isText) return <TextPreview url={downloadUrl} ext={ext} />;
  return null;
}

function TextPreview({ url, ext }) {
  const [content, setContent] = useState(null);
  if (content === null) {
    fetch(url).then(r => r.text()).then(t => setContent(t.slice(0, 800)));
  }
  const colorMap = { json: "#818cf8", html: "#38bdf8", csv: "#00d4aa", md: "#a3e635", txt: "#94a3b8" };
  const color = colorMap[ext] || "#94a3b8";
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${color}22`, background: "rgba(0,0,0,0.35)", overflow: "hidden" }}>
      <div style={{ padding: "7px 13px", borderBottom: `1px solid ${color}15` }}>
        <span style={{ fontSize: 11, color, fontFamily: "var(--font-heading)", fontWeight: 600, textTransform: "uppercase" }}>📄 {ext} Preview</span>
      </div>
      <pre style={{ margin: 0, padding: "12px 14px", fontSize: 11, color: "#8893a4", lineHeight: 1.65, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 180, overflowY: "auto" }}>
        {content === null ? "Loading preview…" : content || "(empty file)"}
        {content && content.length >= 800 && <span style={{ color: "#3d4a5c" }}>{"\n"}…(truncated)</span>}
      </pre>
    </div>
  );
}

// ── Image Options Panel ────────────────────────────────────────────────────
function ImageOptions({ options, onChange, originalWidth, originalHeight }) {
  const accent = "#00d4aa";
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.12)" }}>
      <div style={{ fontSize: 11, color: accent, fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        ⚙ Image Options
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {/* Width */}
        <div>
          <label style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-heading)", display: "block", marginBottom: 4 }}>Width (px)</label>
          <input
            type="number"
            placeholder={originalWidth || "Auto"}
            value={options.width || ""}
            onChange={e => onChange({ ...options, width: e.target.value ? parseInt(e.target.value) : null })}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 8,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-heading)",
              outline: "none",
            }}
          />
        </div>
        {/* Height */}
        <div>
          <label style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-heading)", display: "block", marginBottom: 4 }}>Height (px)</label>
          <input
            type="number"
            placeholder={originalHeight || "Auto"}
            value={options.height || ""}
            onChange={e => onChange({ ...options, height: e.target.value ? parseInt(e.target.value) : null })}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 8,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-heading)",
              outline: "none",
            }}
          />
        </div>
      </div>
      {/* Quality slider */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <label style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>Quality</label>
          <span style={{ fontSize: 11, color: accent, fontFamily: "var(--font-heading)", fontWeight: 600 }}>{options.quality || 92}%</span>
        </div>
        <input
          type="range" min="10" max="100" step="1"
          value={options.quality || 92}
          onChange={e => onChange({ ...options, quality: parseInt(e.target.value) })}
          style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Smaller file</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Best quality</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
        Leave width/height empty to keep original size. Aspect ratio is preserved automatically.
      </div>
    </div>
  );
}

// ── FileCard ───────────────────────────────────────────────────────────────
export default function FileCard({ item, onRemove, onFormatChange, onConvert }) {
  const cfg = FORMAT_MAP[item.type] || {};
  const progress = item.progress ?? 0;
  const [imgOptions, setImgOptions] = useState({ quality: 92, width: null, height: null });
  const [showOptions, setShowOptions] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ w: null, h: null });

  const statusColor =
    item.status === "done"  ? "#00d4aa" :
    item.status === "error" ? "#f43f5e" :
    cfg.color || "#64748b";

  // Load original image dimensions
  const isImageType = item.type === "image";
  if (isImageType && !imgDimensions.w && item.file) {
    const url = URL.createObjectURL(item.file);
    const img = new Image();
    img.onload = () => {
      setImgDimensions({ w: img.width, h: img.height });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.035)",
      border: `1px solid ${item.status === "done" ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 16, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 13,
      position: "relative", overflow: "hidden",
      transition: "border-color 0.3s ease",
    }}>
      {/* Progress bar */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: `${progress}%`, height: 2.5,
        background: progress < 100 ? `linear-gradient(90deg, ${statusColor}, ${statusColor}88)` : statusColor,
        transition: "width 0.35s ease", borderRadius: "2px 2px 0 0",
      }} />

      {/* File info row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${cfg.color}14`, border: `1px solid ${cfg.color}2a`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21,
        }}>
          {item.status === "done" ? "✅" : cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.status === "done" ? item.downloadName : item.file.name}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 11.5, marginTop: 3 }}>
            {(item.file.size / 1024).toFixed(1)} KB ·{" "}
            <span style={{ color: cfg.color, fontWeight: 600 }}>{item.type?.toUpperCase()}</span>
            {imgDimensions.w && item.status !== "done" && (
              <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{imgDimensions.w} × {imgDimensions.h}px</span>
            )}
            {item.status === "done" && item.targetFmt && (
              <span style={{ color: "#00d4aa", marginLeft: 6 }}>→ {item.targetFmt}</span>
            )}
          </div>
        </div>
        <button className="remove-btn" onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 15, padding: "3px 6px", lineHeight: 1 }}>✕</button>
      </div>

      {/* Format selector */}
      {item.status !== "done" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-muted)", fontSize: 10.5, fontFamily: "var(--font-heading)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Convert to</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(cfg.outputs || []).map((fmt) => (
              <button key={fmt} className="fmt-btn" onClick={() => onFormatChange(item.id, fmt)} style={{
                padding: "4px 13px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                fontFamily: "var(--font-heading)", cursor: "pointer",
                border: item.targetFmt === fmt ? `1.5px solid ${cfg.color}` : "1.5px solid rgba(255,255,255,0.09)",
                background: item.targetFmt === fmt ? `${cfg.color}1a` : "transparent",
                color: item.targetFmt === fmt ? cfg.color : "var(--text-secondary)",
              }}>{fmt}</button>
            ))}
          </div>
        </div>
      )}

      {/* Image options toggle */}
      {isImageType && item.status === "idle" && (
        <button
          onClick={() => setShowOptions(s => !s)}
          style={{
            alignSelf: "flex-start", padding: "4px 12px", borderRadius: 8,
            border: `1px solid ${showOptions ? "rgba(0,212,170,0.4)" : "rgba(255,255,255,0.09)"}`,
            background: showOptions ? "rgba(0,212,170,0.08)" : "transparent",
            color: showOptions ? "#00d4aa" : "var(--text-secondary)",
            fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          ⚙ {showOptions ? "Hide Options" : "Resize / Quality"}
        </button>
      )}

      {/* Image options panel */}
      {isImageType && item.status === "idle" && showOptions && (
        <ImageOptions
          options={imgOptions}
          onChange={setImgOptions}
          originalWidth={imgDimensions.w}
          originalHeight={imgDimensions.h}
        />
      )}

      {/* Convert button */}
      {item.status === "idle" && item.targetFmt && (
        <button className="convert-btn" onClick={() => onConvert(item.id, isImageType ? imgOptions : {})} style={{
          padding: "9px 22px", borderRadius: 10, border: "none",
          cursor: "pointer", alignSelf: "flex-start",
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
          color: "#04111d", fontWeight: 700, fontSize: 12,
          fontFamily: "var(--font-heading)",
        }}>
          Convert →
        </button>
      )}

      {/* Loading ffmpeg */}
      {item.status === "loading_ffmpeg" && (
        <div style={{ color: "#f59e0b", fontSize: 12, fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ animation: "spin-slow 1s linear infinite", display: "inline-block" }}>⚙</span>
          Setting up video converter (one-time download, ~30MB)…
        </div>
      )}

      {/* Converting */}
      {item.status === "converting" && (
        <div style={{ color: cfg.color, fontSize: 12.5, fontFamily: "var(--font-heading)", fontWeight: 500 }}>
          Converting… {Math.round(progress)}%
        </div>
      )}

      {/* Done — preview + download */}
      {item.status === "done" && item.downloadUrl && (
        <>
          <Preview item={item} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2 }}>
            <a href={item.downloadUrl} download={item.downloadName} style={{
              padding: "10px 24px", borderRadius: 10, textDecoration: "none",
              background: "linear-gradient(135deg, #00d4aa, #00b894)",
              color: "#04111d", fontWeight: 700, fontSize: 13,
              fontFamily: "var(--font-heading)",
              boxShadow: "0 4px 16px rgba(0,212,170,0.25)",
            }}>
              ↓ Download {item.targetFmt}
            </a>
            <div style={{ fontSize: 12, color: "#00d4aa", fontFamily: "var(--font-heading)", fontWeight: 500 }}>✓ Done</div>
          </div>
        </>
      )}

      {/* Error */}
      {item.status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ color: "#f43f5e", fontSize: 12, fontFamily: "var(--font-heading)" }}>⚠ {item.error}</div>
          <button onClick={() => onConvert(item.id, isImageType ? imgOptions : {})} style={{
            padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(244,63,94,0.3)",
            background: "rgba(244,63,94,0.08)", color: "#f43f5e",
            fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 600, cursor: "pointer",
          }}>Try Again</button>
        </div>
      )}
    </div>
  );
}