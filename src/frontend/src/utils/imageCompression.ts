/**
 * Compress an image File to a JPEG Blob with optional max dimension and size cap.
 * @param file   Source image file from the device file picker
 * @param maxKB  Target max size in kilobytes (default 250)
 * @returns      Compressed Blob (image/jpeg)
 */
export async function compressImage(file: File, maxKB = 250): Promise<Blob> {
  const MAX_DIM = 1200;
  const MAX_BYTES = maxKB * 1024;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively reduce quality until size fits
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }
            if (blob.size <= MAX_BYTES || quality <= 0.1) {
              resolve(blob);
            } else {
              quality = Math.max(0.1, quality - 0.1);
              tryCompress();
            }
          },
          "image/jpeg",
          quality,
        );
      };
      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert a Blob to a base64 data URL string.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
