import { useState, useCallback, useEffect } from "react";
import "./index.css";
import { FORMAT_MAP } from "./constants";
import { detectType } from "./utils/detectType";
import { convertImage } from "./utils/convertImage";
import { convertDocument } from "./utils/convertDocument";
import { convertMedia } from "./utils/convertMedia";
import { loadHistory, saveHistory, clearHistory } from "./utils/history";
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

export default function App() {
  const [files, setFiles] = useState([]);
  const [tab, setTab] = useState("convert");
  const [history, setHistory] = useState([]);
  const [storageStatus, setStorageStatus] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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
        return {
          id: `${Date.now()}-${Math.random()}`,
          file, type,
          targetFmt: null,
          status: "error",
          error: `File too large — max ${MAX_MB}MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
          progress: 0, downloadUrl: null, downloadName: null,
        };
      }

      if (!type) {
        return {
          id: `${Date.now()}-${Math.random()}`,
          file, type: null, targetFmt: null,
          status: "error",
          error: `Sorry, .${file.name.split(".").pop()} files aren't supported yet`,
          progress: 0, downloadUrl: null, downloadName: null,
        };
      }

      return {
        id: `${Date.now()}-${Math.random()}`,
        file, type,
        targetFmt: FORMAT_MAP[type].outputs[0],
        status: "idle",
        error: null,
        progress: 0, downloadUrl: null, downloadName: null,
      };
    });
    setFiles((f) => [...f, ...newItems]);
  }, []);

  const removeFile = (id) => setFiles((f) => f.filter((x) => x.id !== id));
  const setFormat = (id, fmt) => setFiles((f) => f.map((x) => x.id === id ? { ...x, targetFmt: fmt } : x));
  const updateFile = (id, updates) => setFiles((f) => f.map((x) => x.id === id ? { ...x, ...updates } : x));

  const convertFile = async (id) => {
    const item = files.find((x) => x.id === id);
    if (!item) return;
    const fmt = item.targetFmt;
    const isMedia = item.type === "audio" || item.type === "video";
    updateFile(id, { status: isMedia ? "loading_ffmpeg" : "converting", progress: 5 });

    try {
      let blob, ext;
      if (item.type === "image") {
        updateFile(id, { progress: 30 });
        blob = await convertImage(item.file, fmt);
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
        id: `h-${Date.now()}`,
        name: item.file.name,
        to: fmt,
        size: `${(item.file.size / 1024).toFixed(1)} KB`,
        type: item.type,
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        downloadUrl: url,
        downloadName,
      }, ...h.slice(0, 49)]);

    } catch (err) {
      updateFile(id, { status: "error", error: err.message || "Conversion failed." });
    }
  };

  const convertAll = () =>
    files.filter((x) => x.status === "idle" && x.targetFmt).forEach((x) => convertFile(x.id));

  const hasIdle = files.some((x) => x.status === "idle" && x.targetFmt);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {PARTICLES.map((p) => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: p.color, opacity: 0.18,
            animation: `float ${p.speed}s ${p.delay}s ease-in-out infinite`,
          }} />
        ))}
        <div style={{ position: "absolute", top: "-15%", left: "15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,0.055) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "45%", left: "-8%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* ── HEADER ── */}
      <header className="app-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, animation: "fadeUp 0.5s ease forwards" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg, #00d4aa 0%, #0891b2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 19, boxShadow: "0 4px 14px rgba(0,212,170,0.3)",
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>ConvertX</div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>Local · Private · Fast</div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {storageStatus === "saved" && (
            <div style={{ fontSize: 10.5, color: "var(--accent)", fontFamily: "var(--font-heading)", animation: "savedPop 2.2s ease forwards", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              Saved
            </div>
          )}
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "3px", border: "1px solid var(--border)" }}>
            {["convert", "history"].map((t) => (
              <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
                padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                fontFamily: "var(--font-heading)", fontSize: 11.5, fontWeight: 600,
                letterSpacing: "0.02em",
                background: tab === t ? "rgba(255,255,255,0.09)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
              }}>
                {t === "convert" ? "Convert" : `History${history.length > 0 ? ` · ${history.length}` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="app-main" style={{ position: "relative", zIndex: 10 }}>

        {/* CONVERT TAB */}
        {tab === "convert" && (
          <div style={{ animation: "fadeUp 0.45s 0.08s ease both" }}>

            {/* Hero */}
            <div style={{ textAlign: "center", margin: "28px 0 32px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 14px", borderRadius: 20,
                background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)",
                marginBottom: 16,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4aa", display: "inline-block", animation: "pulse 2s ease infinite" }} />
                <span style={{ fontSize: 11, color: "#00d4aa", fontFamily: "var(--font-heading)", fontWeight: 600, letterSpacing: "0.04em" }}>Browser-based · Zero uploads</span>
              </div>

              <h1 className="hero-title" style={{
                fontFamily: "var(--font-heading)", fontWeight: 700,
                color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.15,
                margin: "0 0 14px",
              }}>
                Convert <span style={{ color: "var(--accent)" }}>any file</span>{" "}
                <br />to any format.
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, maxWidth: 460, margin: "0 auto" }}>
                Images · Audio · Video · Documents — converted instantly in your browser. No uploads. No servers. No data leaves your device.
              </p>

              {/* Format pills */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
                {Object.entries(FORMAT_MAP).map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 13px", borderRadius: 20,
                    background: `${v.color}0f`, border: `1px solid ${v.color}28`,
                    fontSize: 12, color: v.color,
                    fontFamily: "var(--font-heading)", fontWeight: 600,
                  }}>
                    {v.icon} {v.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <DropZone onFiles={handleFiles} />

            {/* File cards */}
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hasIdle && (
                  <button className="convert-btn" onClick={convertAll} style={{
                    width: "100%", padding: "14px", borderRadius: 13, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #00d4aa 0%, #0284c7 100%)",
                    color: "#04111d", fontWeight: 700, fontSize: 13.5,
                    fontFamily: "var(--font-heading)", letterSpacing: "0.01em",
                    marginBottom: 6,
                  }}>
                    ⚡ Convert All Files
                  </button>
                )}
                {files.map((item) => (
                  <FileCard key={item.id} item={item} onRemove={removeFile} onFormatChange={setFormat} onConvert={convertFile} />
                ))}
              </div>
            )}

            {/* Empty state grid */}
            {files.length === 0 && (
              <div className="format-grid" style={{ display: "grid", gap: 10, marginTop: 4 }}>
                {Object.entries(FORMAT_MAP).map(([k, v]) => (
                  <div key={k} style={{
                    padding: "18px 16px", borderRadius: 14,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    cursor: "default",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{v.icon}</div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 5 }}>{v.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>{v.outputs.join(" · ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <HistoryTab history={history} onClear={() => { setHistory([]); clearHistory(); }} />
        )}
      </main>

      {/* Footer */}
      <div style={{
        textAlign: "center", paddingBottom: 24,
        color: "var(--text-muted)", fontSize: 11,
        fontFamily: "var(--font-heading)", letterSpacing: "0.06em",
        position: "relative", zIndex: 10,
      }}>
        ConvertX · All conversions happen locally in your browser
      </div>
    </div>
  );
}