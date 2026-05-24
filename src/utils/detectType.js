import { FORMAT_MAP } from "../constants";

export function detectType(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  for (const [type, cfg] of Object.entries(FORMAT_MAP)) {
    if (cfg.exts.includes(ext) || cfg.accepts.includes(file.type)) return type;
  }
  return null;
}
