import { FORMAT_MAP } from "../constants";

export default function HistoryTab({ history, onClear }) {
  const typeIcon = (t) => FORMAT_MAP[t]?.icon || "📁";
  const typeColor = (t) => FORMAT_MAP[t]?.color || "#94a3b8";

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>Conversion History</h2>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {history.length > 0 ? `${history.length} conversion${history.length > 1 ? "s" : ""} · saved in your browser` : "No conversions yet"}
          </div>
        </div>
        {history.length > 0 && (
          <button className="clear-btn" onClick={onClear} style={{
            padding: "7px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.09)",
            background: "transparent", color: "var(--text-secondary)",
            fontSize: 11.5, fontFamily: "var(--font-heading)", fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
          }}>
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8, fontFamily: "var(--font-heading)" }}>
            No conversions yet.<br />
            Convert a file — history saves automatically<br />and persists after refresh.
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h, i) => (
            <div key={h.id + i} className="history-row" style={{
              display: "flex", alignItems: "center", gap: 12, padding: "13px 15px",
              borderRadius: 13, background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${typeColor(h.type)}12`, border: `1px solid ${typeColor(h.type)}22`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{typeIcon(h.type)}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: typeColor(h.type), fontWeight: 600 }}>→ {h.to}</span>
                  {h.size && <span>{h.size}</span>}
                  <span>{h.time}</span>
                </div>
              </div>

              {h.downloadUrl ? (
                <a href={h.downloadUrl} download={h.downloadName} style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none",
                  background: "rgba(0,212,170,0.1)", color: "#00d4aa", fontSize: 16,
                  transition: "background 0.15s",
                }}>↓</a>
              ) : (
                <div title="Re-convert to download" style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.03)", color: "var(--text-muted)", fontSize: 13,
                }}>↺</div>
              )}
            </div>
          ))}

          <div style={{
            marginTop: 6, padding: "11px 16px", borderRadius: 11,
            background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.1)", textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: "#00d4aa", fontFamily: "var(--font-heading)", fontWeight: 600 }}>✓ History saved permanently in your browser</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>To re-download a file, simply convert it again</div>
          </div>
        </div>
      )}
    </div>
  );
}