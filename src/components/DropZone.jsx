import { useRef, useState, useCallback } from "react";

export default function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const dragCounter = useRef(0);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); dragCounter.current = 0;
    setDragging(false); onFiles(e.dataTransfer.files);
  }, [onFiles]);
  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); };
  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="dropzone" onDrop={handleDrop} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onClick={() => inputRef.current?.click()} style={{
      border: dragging ? "2px dashed #00d4aa" : "2px dashed rgba(255,255,255,0.09)",
      borderRadius: 20, padding: "38px 20px", textAlign: "center", cursor: "pointer",
      background: dragging ? "rgba(0,212,170,0.06)" : "rgba(255,255,255,0.018)",
      marginBottom: 18,
    }}>
      <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
      <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1 }}>
        <span style={{
          display: "inline-block",
          animation: dragging ? "spin-slow 0.7s linear infinite" : "float 3.5s ease-in-out infinite",
        }}>⚡</span>
      </div>
      <div style={{
        fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16,
        color: dragging ? "#00d4aa" : "var(--text-secondary)", marginBottom: 6,
      }}>
        {dragging ? "Drop it!" : "Drop files here"}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginBottom: 5 }}>or click to browse</div>
      <div style={{ color: "#2a3a4d", fontSize: 11 }}>
        PNG · JPG · WEBP · MP3 · MP4 · WAV · PDF · TXT · CSV · JSON and more
      </div>
      <div style={{ color: "#1e2d3d", fontSize: 10.5, marginTop: 6 }}>Max file size: 500MB</div>
    </div>
  );
}