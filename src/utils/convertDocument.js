async function extractPDFText(file) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Use legacy build with bundled worker — avoids COEP/CDN issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += `\n--- Page ${i} ---\n${pageText}\n`;
  }

  const trimmed = fullText.trim();
  if (!trimmed) {
    throw new Error("No text found in PDF. This file may be scanned or image-based.");
  }
  return trimmed;
}

export async function convertDocument(file, targetFmt) {
  const isPDF = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  let text;

  if (isPDF) {
    try {
      text = await extractPDFText(file);
    } catch (err) {
      throw new Error(err.message || "Could not extract text from PDF. The file may be scanned/image-based or encrypted.");
    }
  } else {
    text = await file.text();
  }

  let content = "";
  let mime = "text/plain";
  let ext = "txt";

  switch (targetFmt) {
    case "TXT":
      content = text.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
      mime = "text/plain"; ext = "txt";
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
      mime = "text/html"; ext = "html";
      break;
    }

    case "JSON": {
      const lines = text.split("\n").filter(Boolean);
      const obj = { source: file.name, converted_at: new Date().toISOString(), lines };
      content = JSON.stringify(obj, null, 2);
      mime = "application/json"; ext = "json";
      break;
    }

    case "CSV": {
      const lines = text.split("\n").filter(Boolean);
      const rows = ['"line_number","content"'];
      lines.forEach((line, i) => {
        rows.push(`${i + 1},"${line.replace(/"/g, '""')}"`);
      });
      content = rows.join("\n");
      mime = "text/csv"; ext = "csv";
      break;
    }

    case "MARKDOWN": {
      const baseName = file.name.replace(/\.[^.]+$/, "");
      content = `# ${baseName}\n\n> Converted from \`${file.name}\` on ${new Date().toLocaleDateString()}\n\n---\n\n${text}`;
      mime = "text/markdown"; ext = "md";
      break;
    }

    default:
      content = text;
  }

  return { blob: new Blob([content], { type: mime }), ext };
}