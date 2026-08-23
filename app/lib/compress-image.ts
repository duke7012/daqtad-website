/** Keep uploads under Netlify's ~4.5 MB binary request limit. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const MAX_EDGE = 2400;
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}".`));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image."))),
      "image/jpeg",
      quality,
    );
  });
}

function drawScaled(image: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress image.");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function jpegName(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

/**
 * Shrinks photos that exceed the upload limit. Smaller files pass through unchanged.
 * Always outputs JPEG when compression is needed.
 */
export async function compressImageIfNeeded(file: File, maxBytes = MAX_UPLOAD_BYTES): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= maxBytes) return file;

  const image = await loadImage(file);
  let maxEdge = MAX_EDGE;

  for (let pass = 0; pass < 4; pass += 1) {
    const canvas = drawScaled(image, maxEdge);
    for (const quality of QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= maxBytes) {
        return new File([blob], jpegName(file.name), { type: "image/jpeg", lastModified: Date.now() });
      }
    }
    maxEdge = Math.round(maxEdge * 0.75);
  }

  throw new Error(`"${file.name}" is still too large after compression. Try a smaller export.`);
}
