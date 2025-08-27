export async function composeLastOverlayImage(overlayBase64: string, opts?: { borderPx?: number }) {
  const borderPx = opts?.borderPx ?? 20;
  const bgSrc = '/page-last-001.png';

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  const [bg, overlay] = await Promise.all([
    loadImage(bgSrc),
    loadImage(overlayBase64)
  ]);

  // Create square canvas based on background max dimension
  const size = Math.max(bg.width, bg.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fill white and draw background centered, preserving aspect
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const bgScale = Math.min(size / bg.width, size / bg.height);
  const bgW = Math.floor(bg.width * bgScale);
  const bgH = Math.floor(bg.height * bgScale);
  const bgX = Math.floor((size - bgW) / 2);
  const bgY = Math.floor((size - bgH) / 2);
  ctx.drawImage(bg, bgX, bgY, bgW, bgH);

  // Draw overlay at center, 50% of canvas height, preserve aspect ratio to avoid skew
  const targetH = Math.floor(size * 0.5);
  const aspectW = overlay.height > 0 ? overlay.width / overlay.height : 1;
  const targetW = Math.max(1, Math.floor(targetH * aspectW));
  const ox = Math.floor((size - targetW) / 2);
  const oy = Math.floor((size - targetH) / 2);

  // White border behind overlay
  if (borderPx > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox - borderPx, oy - borderPx, targetW + borderPx * 2, targetH + borderPx * 2);
  }

  // Draw the overlay preserving aspect ratio
  ctx.drawImage(overlay, ox, oy, targetW, targetH);

  return canvas.toDataURL('image/png');
}
