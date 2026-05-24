export async function convertImage(file, targetFmt) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // Fill white background for JPEG (no transparency support)
      if (targetFmt === "JPEG") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const mimeMap = {
        PNG: "image/png",
        JPEG: "image/jpeg",
        WEBP: "image/webp",
        GIF: "image/gif",
        BMP: "image/bmp",
      };

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image conversion failed"));
        },
        mimeMap[targetFmt] || "image/png",
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
}
