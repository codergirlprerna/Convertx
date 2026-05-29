// options: { width, height, quality (1-100) }
// Returns { blob, originalSize, outputSize, savedPercent }
export async function convertImage(file, targetFmt, options = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      let { width, height } = options;
      const originalW = img.width;
      const originalH = img.height;

      if (width && !height) {
        height = Math.round((originalH / originalW) * width);
      } else if (height && !width) {
        width = Math.round((originalW / originalH) * height);
      } else if (!width && !height) {
        width = originalW;
        height = originalH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // White background for JPEG (no transparency)
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

      const supportsQuality = ["JPEG", "WEBP"].includes(targetFmt);

      // Smart quality:
      // - If user set quality manually → use it
      // - JPEG/WEBP default → 0.85 (good balance of size vs quality)
      // - PNG/GIF/BMP → quality param is ignored by browser anyway
      const quality = supportsQuality
        ? (options.quality ? options.quality / 100 : 0.85)
        : undefined;

      const originalSize = file.size;

      // For JPEG/WEBP: if output is LARGER than input, auto-reduce quality
      // until output < input OR quality hits 0.5 floor
      const tryEncode = (q) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Image conversion failed")); return; }

          // If output is bigger than original AND format supports quality
          // AND user didn't manually set quality → auto-shrink
          if (
            supportsQuality &&
            !options.quality &&
            blob.size > originalSize &&
            q > 0.5
          ) {
            tryEncode(Math.max(q - 0.1, 0.5));
            return;
          }

          const savedPercent = Math.round((1 - blob.size / originalSize) * 100);
          resolve({ blob, originalSize, outputSize: blob.size, savedPercent });
        }, mimeMap[targetFmt] || "image/png", q);
      };

      tryEncode(quality ?? 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
}