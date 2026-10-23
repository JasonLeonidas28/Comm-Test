/**
 * Compresses an image file client-side to keep the report lightweight and responsive
 * while maintaining sufficient sharpness to read labels, serial numbers, and meter gauges.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82,
  watermarkText?: string,
  gpsCoord?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Optional Watermark (Item, Timestamp & GPS Location Proof)
        if (watermarkText) {
          const fontSize = Math.max(13, Math.round(width * 0.022));
          ctx.font = `600 ${fontSize}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';

          const line1 = watermarkText;
          const line2 = gpsCoord ? `📍 GPS: ${gpsCoord}` : '';

          const metrics1 = ctx.measureText(line1);
          const metrics2 = line2 ? ctx.measureText(line2) : { width: 0 };
          const maxWidthText = Math.max(metrics1.width, metrics2.width);

          const padding = 10;
          const bgWidth = maxWidthText + padding * 2;
          const bgHeight = (line2 ? fontSize * 2.3 : fontSize * 1.2) + padding * 1.5;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(width - bgWidth - 10, height - bgHeight - 10, bgWidth, bgHeight);

          ctx.fillStyle = '#ffffff';
          if (line2) {
            ctx.fillText(line1, width - 10 - padding, height - 10 - fontSize * 1.25);
            ctx.fillStyle = '#4ade80'; // soft green for GPS coords
            ctx.fillText(line2, width - 10 - padding, height - 10 - padding / 2);
          } else {
            ctx.fillText(line1, width - 10 - padding, height - 10 - padding / 2);
          }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas'));
    reader.readAsDataURL(file);
  });
}

/**
 * Formats a clean date/time string for photos
 */
export function getFormattedTimestamp(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}`;
}
