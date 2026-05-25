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

// ── Share Card Modal ───────────────────────────────────────────────────────
function ShareModal({ file, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareText = `I just converted ${file.name} → ${file.to} using ConvertX ⚡ Free browser-based file converter — no uploads, no servers. Try it: https://convertx.vercel.app`;
  const shareTextEncoded = encodeURIComponent(shareText);

  const copyText = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const SHARE_OPTIONS = [
    {
      label: "WhatsApp",
      icon: "💬",
      color: "#25d366",
      bg: "rgba(37,211,102,0.08)",
      border: "rgba(37,211,102,0.25)",
      action: () => window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank"),
    },
    {
      label: "Gmail",
      icon: "✉️",
      color: "#ea4335",
      bg: "rgba(234,67,53,0.08)",
      border: "rgba(234,67,53,0.25)",
      action: () => window.open(`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent("Check out ConvertX!")}&body=${shareTextEncoded}`, "_blank"),
    },
    {
      label: "Telegram",
      icon: "✈️",
      color: "#2aabee",
      bg: "rgba(42,171,238,0.08)",
      border: "rgba(42,171,238,0.25)",
      action: () => window.open(`https://t.me/share/url?url=https://convertx.vercel.app&text=${shareTextEncoded}`, "_blank"),
    },
    {
      label: "X / Twitter",
      icon: "𝕏",
      color: "#e7e9ea",
      bg: "rgba(231,233,234,0.06)",
      border: "rgba(231,233,234,0.15)",
      action: () => window.open(`https://twitter.com/intent/tweet?text=${shareTextEncoded}`, "_blank"),
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg2)", border: "1px solid var(--border2)",
        borderRadius: 20, padding: "24px", maxWidth: 380, width: "100%",
        animation: "shareSlideUp 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
            Share ConvertX
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Preview card */}
        <div style={{
          padding: "14px", borderRadius: 12,
          background: "linear-gradient(135deg, rgba(0,212,170,0.07), rgba(8,145,178,0.07))",
          border: "1px solid rgba(0,212,170,0.18)", marginBottom: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00d4aa, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>ConvertX</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Converted <strong style={{ color: "var(--text-primary)" }}>{file.name}</strong> → <strong style={{ color: "#00d4aa" }}>{file.to}</strong>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            Free · No uploads · No servers
          </div>
        </div>

        {/* Share buttons grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {SHARE_OPTIONS.map((opt) => (
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

        {/* Copy link */}
        <button onClick={copyText} style={{
          width: "100%", padding: "11px", borderRadius: 11, cursor: "pointer",
          background: copied ? "rgba(0,212,170,0.1)" : "var(--surface)",
          border: `1px solid ${copied ? "rgba(0,212,170,0.3)" : "var(--border)"}`,
          color: copied ? "#00d4aa" : "var(--text-secondary)",
          fontWeight: 600, fontSize: 13, fontFamily: "var(--font-heading)",
          transition: "all 0.2s",
        }}>
          {copied ? "✓ Copied to clipboard!" : "📋 Copy share text"}
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

  // Apply theme to document
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
      if (file.size > MAX_BYTES) {
        return { id: `${Date.now()}-${Math.random()}`, file, type, targetFmt: null, status: "error", error: `File too large — max ${MAX_MB}MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, progress: 0, downloadUrl: null, downloadName: null };
      }
      if (!type) {
        return { id: `${Date.now()}-${Math.random()}`, file, type: null, targetFmt: null, status: "error", error: `Sorry, .${file.name.split(".").pop()} files aren't supported yet`, progress: 0, downloadUrl: null, downloadName: null };
      }
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

      const entry = {
        id: `h-${Date.now()}`,
        name: item.file.name,
        to: fmt,
        size: `${(item.file.size / 1024).toFixed(1)} KB`,
        type: item.type,
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        downloadUrl: url,
        downloadName,
      };
      setHistory((h) => [entry, ...h.slice(0, 49)]);

    } catch (err) {
      updateFile(id, { status: "error", error: err.message || "Conversion failed." });
    }
  };

  const convertAll = () =>
    files.filter((x) => x.status === "idle" && x.targetFmt).forEach((x) => convertFile(x.id, {}));

  const hasIdle = files.some((x) => x.status === "idle" && x.targetFmt);
  const doneFiles = files.filter((x) => x.status === "done" && x.downloadUrl);

  const downloadAllAsZip = async () => {
    const toZip = await Promise.all(
      doneFiles.map(async (item) => {
        const res = await fetch(item.downloadUrl);
        const blob = await res.blob();
        return { blob, name: item.downloadName };
      })
    );
    await downloadAsZip(toZip);
  };

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* Background particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {PARTICLES.map((p) => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: "var(--particle-opacity)",
            animation: `float ${p.speed}s ${p.delay}s ease-in-out infinite`,
          }} />
        ))}
        <div style={{ position: "absolute", top: "-15%", left: "15%", width: 600, height: 600, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(0,212,170,0.055) 0%, transparent 65%)" : "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 450, height: 450, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 65%)" : "radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* ── HEADER ── */}
      <header className="app-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, animation: "fadeUp 0.5s ease forwards" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #00d4aa 0%, #0891b2 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: "0 4px 14px rgba(0,212,170,0.3)" }}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>ConvertX</div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>Local · Private · Fast</div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {storageStatus === "saved" && (
            <div style={{ fontSize: 10.5, color: "var(--accent)", fontFamily: "var(--font-heading)", animation: "savedPop 2.2s ease forwards", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              Saved
            </div>
          )}

          {/* Theme toggle */}
          <button className="theme-btn" onClick={() => setTheme(isDark ? "light" : "dark")} title={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, background: "var(--surface)", borderRadius: 12, padding: "3px", border: "1px solid var(--border)" }}>
            {["convert", "history"].map((t) => (
              <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
                padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                fontFamily: "var(--font-heading)", fontSize: 11.5, fontWeight: 600,
                background: tab === t ? "var(--surface2)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
              }}>
                {t === "convert" ? "Convert" : `History${history.length > 0 ? ` · ${history.length}` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="app-main" style={{ position: "relative", zIndex: 10 }}>

        {tab === "convert" && (
          <div style={{ animation: "fadeUp 0.45s 0.08s ease both" }}>

            {/* Hero */}
            <div style={{ textAlign: "center", margin: "28px 0 32px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "var(--accent-dim)", border: "1px solid rgba(0,212,170,0.2)", marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 2s ease infinite" }} />
                <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-heading)", fontWeight: 600, letterSpacing: "0.04em" }}>Browser-based · Zero uploads</span>
              </div>
              <h1 className="hero-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.15, margin: "0 0 14px" }}>
                Convert <span style={{ color: "var(--accent)" }}>any file</span>{" "}<br />to any format.
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
                  <FileCard key={item.id} item={item} onRemove={removeFile} onFormatChange={setFormat} onConvert={convertFile} onShare={(f) => setShareFile(f)} />
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

        {tab === "history" && (
          <HistoryTab history={history} onClear={() => { setHistory([]); clearHistory(); }} />
        )}
      </main>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingBottom: 24, color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-heading)", letterSpacing: "0.06em", position: "relative", zIndex: 10 }}>
        ConvertX · All conversions happen locally in your browser
      </div>

      {/* Share Modal */}
      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
    </div>
  );
}