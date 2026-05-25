// options: { width, height, quality (1-100), maintainAspectRatio }
export async function convertImage(file, targetFmt, options = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      // Resize logic
      let { width, height } = options;
      const originalW = img.width;
      const originalH = img.height;

      if (width && !height) {
        // Only width given — maintain aspect ratio
        height = Math.round((originalH / originalW) * width);
      } else if (height && !width) {
        // Only height given — maintain aspect ratio
        width = Math.round((originalW / originalH) * height);
      } else if (!width && !height) {
        // No resize — use original
        width = originalW;
        height = originalH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Fill white background for JPEG
      if (targetFmt === "JPEG") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const mimeMap = {
        PNG: "image/png",
        JPEG: "image/jpeg",
        WEBP: "image/webp",
        GIF: "image/gif",
        BMP: "image/bmp",
      };

      // Quality: 1–100 → 0.01–1.0 (only affects JPEG/WEBP)
      const quality = options.quality ? options.quality / 100 : 0.92;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image conversion failed"));
        },
        mimeMap[targetFmt] || "image/png",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
}