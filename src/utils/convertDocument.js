export async function convertDocument(file, targetFmt) {
  const text = await file.text();
  let content = "";
  let mime = "text/plain";
  let ext = "txt";

  switch (targetFmt) {
    case "TXT":
      content = text.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
      mime = "text/plain";
      ext = "txt";
      break;

    case "HTML": {
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${file.name}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1e293b; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
</body>
</html>`;
      mime = "text/html";
      ext = "html";
      break;
    }

    case "JSON": {
      const lines = text.split("\n").filter(Boolean);
      const obj = {
        source: file.name,
        converted_at: new Date().toISOString(),
        lines,
      };
      content = JSON.stringify(obj, null, 2);
      mime = "application/json";
      ext = "json";
      break;
    }

    case "CSV": {
      const lines = text.split("\n").filter(Boolean);
      const rows = ['"line_number","content"'];
      lines.forEach((line, i) => {
        rows.push(`${i + 1},"${line.replace(/"/g, '""')}"`);
      });
      content = rows.join("\n");
      mime = "text/csv";
      ext = "csv";
      break;
    }

    case "MARKDOWN": {
      const baseName = file.name.replace(/\.[^.]+$/, "");
      content = `# ${baseName}\n\n> Converted from \`${file.name}\` on ${new Date().toLocaleDateString()}\n\n---\n\n${text}`;
      mime = "text/markdown";
      ext = "md";
      break;
    }

    default:
      content = text;
  }

  return { blob: new Blob([content], { type: mime }), ext };
}
