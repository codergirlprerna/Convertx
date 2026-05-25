import { useState, useCallback, useEffect } from "react";
import "./index.css";
import { FORMAT_MAP } from "./constants";
import { detectType } from "./utils/detectType";
import { convertImage } from "./utils/convertImage";
import { convertDocument } from "./utils/convertDocument";
import { convertMedia } from "./utils/convertMedia";
import { loadHistory, saveHistory, clearHistory } from "./utils/history";
import { downloadAsZip } from "./utils/zipDownload";
import FileCard from "./components/FileCard";
import DropZone from "./components/DropZone";
import HistoryTab from "./components/HistoryTab";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 1,
  speed: Math.random() * 22 + 14,
  delay: Math.random() * -22,
  color: ["#00d4aa","#f59e0b","#f43f5e","#818cf8","#38bdf8"][Math.floor(Math.random() * 5)],
}));

// ── Share Modal ─────────────────────────────────────────────────────────────
// Shares the ACTUAL converted file — not just text
function ShareModal({ file, onClose }) {
  const [status, setStatus] = useState(null); // null | "sharing" | "copied" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  // file = { name, to, downloadUrl, downloadName, blob? }

  // Fetch blob from the object URL
  const getBlob = async () => {
    const res = await fetch(file.downloadUrl);
    return await res.blob();
  };

  // Web Share API — shares actual file (works on mobile WhatsApp, Telegram etc.)
  const shareNative = async () => {
    if (!navigator.canShare) {
      setErrorMsg("Your browser doesn't support native file sharing. Use the options below.");
      setStatus("error");
      return;
    }
    try {
      setStatus("sharing");
      const blob = await getBlob();
      const f = new File([blob], file.downloadName, { type: blob.type });
      if (navigator.canShare({ files: [f] })) {
        await navigator.share({
          files: [f],
          title: "ConvertX",
          text: `Converted ${file.name} → ${file.to}`,
        });
        setStatus(null);
      } else {
        setErrorMsg("File sharing not supported on this device. Download and share manually.");
        setStatus("error");
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setErrorMsg("Sharing failed. Try downloading and sharing manually.");
        setStatus("error");
      } else {
        setStatus(null);
      }
    }
  };

  // WhatsApp — share file via download + open WA
  // On mobile: Web Share API handles it (above)
  // On desktop: download file + open WA web with message
  const shareWhatsApp = async () => {
    const msg = encodeURIComponent(`Here's my converted file: ${file.downloadName} (converted from ${file.name} using ConvertX)`);
    // Try native share first on mobile
    if (navigator.canShare) {
      await shareNative();
    } else {
      // Desktop fallback — open WA with text
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
  };

  // Gmail — download file + open Gmail compose
  const shareGmail = async () => {
    const subject = encodeURIComponent(`Converted file: ${file.downloadName}`);
    const body = encodeURIComponent(`Hi,\n\nPlease find the converted file attached: ${file.downloadName}\n\nConverted from ${file.name} → ${file.to} using ConvertX (https://convertx.vercel.app)\n\nNote: Please download the file from ConvertX and attach it manually to this email.`);
    // Trigger download first
    const a = document.createElement("a");
    a.href = file.downloadUrl;
    a.download = file.downloadName;
    a.click();
    // Open Gmail after short delay
    setTimeout(() => {
      window.open(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`, "_blank");
    }, 800);
  };

  // Telegram — native share on mobile, text link on desktop
  const shareTelegram = async () => {
    if (navigator.canShare) {
      await shareNative();
    } else {
      const msg = encodeURIComponent(`Converted ${file.name} → ${file.to} using ConvertX ⚡\nhttps://convertx.vercel.app`);
      window.open(`https://t.me/share/url?url=https://convertx.vercel.app&text=${msg}`, "_blank");
    }
  };

  // Copy download link (blob URL)
  const copyLink = () => {
    navigator.clipboard.writeText(
      `Converted ${file.name} → ${file.to} using ConvertX ⚡\nDownload: ${file.downloadName}\nTry it free: https://convertx.vercel.app`
    ).then(() => {
      setStatus("copied");
      setTimeout(() => setStatus(null), 2000);
    });
  };

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg2)", border: "1px solid var(--border2)",
        borderRadius: 20, padding: "22px 20px",
        width: "100%", maxWidth: 360,
        animation: "shareSlideUp 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
            Share Converted File
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* File info */}
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: "var(--accent-dim)", border: "1px solid rgba(0,212,170,0.2)",
          marginBottom: 12, display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ fontSize: 22 }}>
            {file.type === "image" ? "🖼" : file.type === "audio" ? "🎵" : file.type === "video" ? "🎬" : "📄"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {file.downloadName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {file.name} → <span style={{ color: "var(--accent)", fontWeight: 700 }}>{file.to}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp image warning */}
        {file.type === "image" && (
          <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 9, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 11, color: "#f59e0b", lineHeight: 1.55 }}>
            ⚠ <strong>WhatsApp & Telegram always re-compress images to JPEG</strong> — your {file.to} format won't be preserved. To keep the original format, use <strong>Download</strong> and share the file manually, or send via <strong>Gmail</strong> as an attachment.
          </div>
        )}

        {/* Mobile: native share button (shares actual file) */}
        {isMobile && (
          <button onClick={shareNative} disabled={status === "sharing"} style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            cursor: "pointer", marginBottom: 10,
            background: "linear-gradient(135deg, #00d4aa, #0891b2)",
            color: "#04111d", fontWeight: 700, fontSize: 14,
            fontFamily: "var(--font-heading)",
            opacity: status === "sharing" ? 0.7 : 1,
          }}>
            {status === "sharing" ? "Opening share sheet…" : "📤 Share File (WhatsApp / Telegram / Drive…)"}
          </button>
        )}

        {/* Desktop: platform buttons */}
        {!isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "WhatsApp", icon: "💬", color: "#25d366", bg: "rgba(37,211,102,0.08)", border: "rgba(37,211,102,0.25)", action: shareWhatsApp },
              { label: "Gmail", icon: "✉️", color: "#ea4335", bg: "rgba(234,67,53,0.08)", border: "rgba(234,67,53,0.25)", action: shareGmail },
              { label: "Telegram", icon: "✈️", color: "#2aabee", bg: "rgba(42,171,238,0.08)", border: "rgba(42,171,238,0.25)", action: shareTelegram },
              { label: "Download", icon: "↓", color: "#818cf8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.25)", action: () => { const a = document.createElement("a"); a.href = file.downloadUrl; a.download = file.downloadName; a.click(); } },
            ].map((opt) => (
              <button key={opt.label} onClick={opt.action} style={{
                padding: "12px 10px", borderRadius: 12, cursor: "pointer",
                background: opt.bg, border: `1px solid ${opt.border}`,
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13,
                color: opt.color, transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Gmail note for desktop */}
        {!isMobile && (
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", lineHeight: 1.5 }}>
            💡 Gmail will auto-download the file. Attach it manually in the compose window that opens.
          </div>
        )}

        {/* Error message */}
        {status === "error" && (
          <div style={{ fontSize: 11.5, color: "#f59e0b", marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* Copy text */}
        <button onClick={copyLink} style={{
          width: "100%", padding: "11px", borderRadius: 11, cursor: "pointer",
          background: status === "copied" ? "rgba(0,212,170,0.1)" : "var(--surface)",
          border: `1px solid ${status === "copied" ? "rgba(0,212,170,0.3)" : "var(--border)"}`,
          color: status === "copied" ? "#00d4aa" : "var(--text-secondary)",
          fontWeight: 600, fontSize: 13, fontFamily: "var(--font-heading)",
          transition: "all 0.2s",
        }}>
          {status === "copied" ? "✓ Copied!" : "📋 Copy share message"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [files, setFiles] = useState([]);
  const [tab, setTab] = useState("convert");
  const [history, setHistory] = useState([]);
  const [storageStatus, setStorageStatus] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("convertx_theme") || "dark");
  const [shareFile, setShareFile] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("convertx_theme", theme);
  }, [theme]);

  useEffect(() => {
    setHistory(loadHistory());
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    saveHistory(history);
    if (history.length > 0) {
      setStorageStatus("saved");
      const t = setTimeout(() => setStorageStatus(null), 2200);
      return () => clearTimeout(t);
    }
  }, [history, historyLoaded]);

  const handleFiles = useCallback((fileList) => {
    const MAX_MB = 500;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    const newItems = Array.from(fileList).map((file) => {
      const type = detectType(file);
      if (file.size > MAX_BYTES) return { id: `${Date.now()}-${Math.random()}`, file, type, targetFmt: null, status: "error", error: `File too large — max ${MAX_MB}MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, progress: 0, downloadUrl: null, downloadName: null };
      if (!type) return { id: `${Date.now()}-${Math.random()}`, file, type: null, targetFmt: null, status: "error", error: `Sorry, .${file.name.split(".").pop()} files aren't supported yet`, progress: 0, downloadUrl: null, downloadName: null };
      return { id: `${Date.now()}-${Math.random()}`, file, type, targetFmt: FORMAT_MAP[type].outputs[0], status: "idle", error: null, progress: 0, downloadUrl: null, downloadName: null };
    });
    setFiles((f) => [...f, ...newItems]);
  }, []);

  const removeFile = (id) => setFiles((f) => f.filter((x) => x.id !== id));
  const setFormat = (id, fmt) => setFiles((f) => f.map((x) => x.id === id ? { ...x, targetFmt: fmt } : x));
  const updateFile = (id, updates) => setFiles((f) => f.map((x) => x.id === id ? { ...x, ...updates } : x));

  const convertFile = async (id, imgOptions = {}) => {
    const item = files.find((x) => x.id === id);
    if (!item) return;
    const fmt = item.targetFmt;
    const isMedia = item.type === "audio" || item.type === "video";
    updateFile(id, { status: isMedia ? "loading_ffmpeg" : "converting", progress: 5 });
    try {
      let blob, ext;
      if (item.type === "image") {
        updateFile(id, { progress: 30 });
        blob = await convertImage(item.file, fmt, imgOptions);
        ext = fmt.toLowerCase() === "jpeg" ? "jpg" : fmt.toLowerCase();
        updateFile(id, { progress: 90 });
      } else if (item.type === "document") {
        updateFile(id, { progress: 40 });
        const r = await convertDocument(item.file, fmt);
        blob = r.blob; ext = r.ext;
        updateFile(id, { progress: 90 });
      } else {
        updateFile(id, { status: "converting", progress: 10 });
        const r = await convertMedia(item.file, fmt, (p) => updateFile(id, { progress: p }));
        blob = r.blob; ext = r.ext;
      }
      const url = URL.createObjectURL(blob);
      const baseName = item.file.name.replace(/\.[^.]+$/, "");
      const downloadName = `${baseName}_convertx.${ext}`;
      updateFile(id, { status: "done", progress: 100, downloadUrl: url, downloadName });
      setHistory((h) => [{
        id: `h-${Date.now()}`, name: item.file.name, to: fmt,
        size: `${(item.file.size / 1024).toFixed(1)} KB`, type: item.type,
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        downloadUrl: url, downloadName,
      }, ...h.slice(0, 49)]);
    } catch (err) {
      updateFile(id, { status: "error", error: err.message || "Conversion failed." });
    }
  };

  const convertAll = () => files.filter((x) => x.status === "idle" && x.targetFmt).forEach((x) => convertFile(x.id, {}));
  const hasIdle = files.some((x) => x.status === "idle" && x.targetFmt);
  const doneFiles = files.filter((x) => x.status === "done" && x.downloadUrl);

  const downloadAllAsZip = async () => {
    const toZip = await Promise.all(doneFiles.map(async (item) => {
      const res = await fetch(item.downloadUrl);
      const blob = await res.blob();
      return { blob, name: item.downloadName };
    }));
    await downloadAsZip(toZip);
  };

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* BG particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {PARTICLES.map((p) => (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: p.color, opacity: "var(--particle-opacity)", animation: `float ${p.speed}s ${p.delay}s ease-in-out infinite` }} />
        ))}
        <div style={{ position: "absolute", top: "-15%", left: "15%", width: 600, height: 600, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(0,212,170,0.055) 0%, transparent 65%)" : "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 450, height: 450, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 65%)" : "radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* ── HEADER ── fully responsive, wraps on mobile */}
      <header className="app-header" style={{ position: "relative", zIndex: 10, animation: "fadeUp 0.5s ease forwards" }}>
        <div className="header-inner">
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00d4aa 0%, #0891b2 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: "0 4px 14px rgba(0,212,170,0.3)" }}>⚡</div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>ConvertX</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>Local · Private · Fast</div>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {storageStatus === "saved" && (
              <div style={{ fontSize: 10, color: "var(--accent)", fontFamily: "var(--font-heading)", animation: "savedPop 2.2s ease forwards", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                Saved
              </div>
            )}
            {/* Theme toggle */}
            <button className="theme-btn" onClick={() => setTheme(isDark ? "light" : "dark")} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, background: "var(--surface)", borderRadius: 11, padding: "3px", border: "1px solid var(--border)" }}>
              {["convert", "history"].map((t) => (
                <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 600,
                  background: tab === t ? "var(--surface2)" : "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}>
                  {t === "convert" ? "Convert" : `History${history.length > 0 ? ` · ${history.length}` : ""}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="app-main" style={{ position: "relative", zIndex: 10 }}>
        {tab === "convert" && (
          <div style={{ animation: "fadeUp 0.45s 0.08s ease both" }}>
            <div style={{ textAlign: "center", margin: "28px 0 32px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "var(--accent-dim)", border: "1px solid rgba(0,212,170,0.2)", marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 2s ease infinite" }} />
                <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-heading)", fontWeight: 600, letterSpacing: "0.04em" }}>Browser-based · Zero uploads</span>
              </div>
              <h1 className="hero-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.15, margin: "0 0 14px" }}>
                Convert <span style={{ color: "var(--accent)" }}>any file</span><br />to any format.
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, maxWidth: 460, margin: "0 auto" }}>
                Images · Audio · Video · Documents — converted instantly in your browser. No uploads. No servers. No data leaves your device.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
                {Object.entries(FORMAT_MAP).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 20, background: `${v.color}0f`, border: `1px solid ${v.color}28`, fontSize: 12, color: v.color, fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {v.icon} {v.label}
                  </div>
                ))}
              </div>
            </div>

            <DropZone onFiles={handleFiles} />

            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hasIdle && (
                  <button className="convert-btn" onClick={convertAll} style={{ width: "100%", padding: "14px", borderRadius: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #00d4aa 0%, #0284c7 100%)", color: "#04111d", fontWeight: 700, fontSize: 13.5, fontFamily: "var(--font-heading)", marginBottom: 4 }}>
                    ⚡ Convert All Files
                  </button>
                )}
                {doneFiles.length >= 2 && (
                  <button className="convert-btn" onClick={downloadAllAsZip} style={{ width: "100%", padding: "12px", borderRadius: 13, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)", color: "#818cf8", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-heading)", cursor: "pointer", marginBottom: 4 }}>
                    ↓ Download All as ZIP ({doneFiles.length} files)
                  </button>
                )}
                {files.map((item) => (
                  <FileCard key={item.id} item={item} onRemove={removeFile} onFormatChange={setFormat} onConvert={convertFile}
                    onShare={(f) => setShareFile({ ...f, downloadUrl: item.downloadUrl, downloadName: item.downloadName, type: item.type })}
                  />
                ))}
              </div>
            )}

            {files.length === 0 && (
              <div className="format-grid" style={{ display: "grid", gap: 10, marginTop: 4 }}>
                {Object.entries(FORMAT_MAP).map(([k, v]) => (
                  <div key={k} style={{ padding: "18px 16px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{v.icon}</div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 5 }}>{v.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>{v.outputs.join(" · ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "history" && <HistoryTab history={history} onClear={() => { setHistory([]); clearHistory(); }} />}
      </main>

      <div style={{ textAlign: "center", paddingBottom: 24, color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-heading)", letterSpacing: "0.06em", position: "relative", zIndex: 10 }}>
        ConvertX · All conversions happen locally in your browser
      </div>

      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
    </div>
  );
}