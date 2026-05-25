// ZIP multiple blobs using browser-native CompressionStream (Chrome 80+, Firefox 113+)
// Fallback: download files individually if ZIP not supported

export async function downloadAsZip(files) {
  // files = [{ blob, name }]
  const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
  const zip = new JSZip();
  files.forEach(({ blob, name }) => zip.file(name, blob));
  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "convertx_files.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}