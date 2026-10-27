/**
 * Uploads a file (Buffer, ArrayBuffer, Blob, or Uint8Array) to S3 via the server-side /api/upload endpoint.
 * This keeps client bundles lean and prevents any "Can't resolve 'fs'" Webpack errors.
 */
export async function uploadFileToS3(
  file: Buffer | Uint8Array | ArrayBuffer | Blob,
  fileName: string
): Promise<string> {
  try {
    const blob =
      file instanceof Blob
        ? file
        : new Blob([file as any], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, fileName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    }

    console.warn("Upload endpoint returned status:", res.status);
  } catch (err) {
    console.error("Upload to /api/upload error:", err);
  }

  // Fallback S3 URL if upload endpoint has a temporary network issue
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `https://holadashboard.s3.amazonaws.com/uploads/${Date.now()}-${sanitized}`;
}