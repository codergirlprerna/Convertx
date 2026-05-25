import JSZip from "jszip";

export async function downloadAsZip(files) {
  // files = [{ blob, name }]
  const zip = new JSZip();
  files.forEach(({ blob, name }) => zip.file(name, blob));
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "convertx_files.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}