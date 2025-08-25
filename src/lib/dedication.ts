export type DedicationOptions = {
  templateSrc?: string; // default '/page-first-003.png'
  // cloud detection thresholds
  whiteThreshold?: number; // 0..255 default 235
  minRegionWidthPct?: number; // default 0.3
  minRegionHeightPct?: number; // default 0.12
  searchBandTopPct?: number; // default 0.05 (scan from near top)
  searchBandBottomPct?: number; // default 0.95 (to near bottom)
  // text
  minLines?: number; // default 1
  maxLines?: number; // default 50
  maxChars?: number; // default 2000
  fontFamily?: string; // default 'Georgia, serif'
  color?: string; // default '#1f2937'
  // fixed box controls (percentages of canvas size)
  boxWidthPct?: number; // default 0.6
  boxHeightPct?: number; // default 0.4
  boxTopMarginPct?: number; // default 0.1 (top margin)
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function isWhiteLike(r: number, g: number, b: number, thr: number) {
  return r >= thr && g >= thr && b >= thr;
}

function measureWrapped(ctx: CanvasRenderingContext2D, text: string, fontSize: number, width: number, fontFamily: string = 'Comic Sans MS, cursive, fantasy') {
  // returns {lines, height}
  const lines: string[] = [];
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Split by line breaks first
  const paragraphs = (text || '').split('\n');
  
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push(''); // Preserve empty lines
      continue;
    }
    
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > width) { 
        if (line) lines.push(line); 
        line = w; 
      } else { 
        line = test; 
      }
    }
    if (line) lines.push(line);
  }
  
  // line height factor ~1.25
  const height = lines.length * (fontSize * 1.25);
  return { lines, height };
}

export async function composeDedicationImage(text: string, opts: DedicationOptions = {}): Promise<string> {
  const {
    templateSrc = '/page-first-003.png',
    whiteThreshold = 235,
    minRegionWidthPct = 0.3,
    minRegionHeightPct = 0.12,
    searchBandTopPct = 0.05,
    searchBandBottomPct = 0.95,
    minLines = 1,
    maxLines = 50,  // Increased to support many more lines
    maxChars = 2000,  // Significantly increased character limit
    fontFamily = 'Comic Sans MS, cursive, fantasy',  // Fun font family
    color = '#1f2937',
    boxWidthPct = 0.6,  // 60% width as requested
    boxHeightPct = 0.4,  // 40% height as requested
    boxTopMarginPct = 0.1,  // 10% top margin as requested
  } = opts || {};

  // Preserve intentional line breaks while normalizing spaces
  const sanitized = (text || '').trim()
    .split('\n')
    .map(line => line.trim().replace(/\s+/g, ' '))
    .join('\n')
    .slice(0, maxChars);
  const img = await loadImage(templateSrc);
  // Normalize to square canvas
  const size = Math.max(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,size,size);
  // draw background centered
  const scale = Math.min(size / img.width, size / img.height);
  const drawW = img.width * scale; const drawH = img.height * scale;
  const dx = (size - drawW) / 2; const dy = (size - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);

  // Fixed text box: centered horizontally, 60% width, 40% height, 10% top margin
  const cloudW = Math.floor(size * Math.max(0.1, Math.min(0.95, boxWidthPct)));
  const cloudH = Math.floor(size * Math.max(0.1, Math.min(0.95, boxHeightPct)));
  const cloudX = Math.floor((size - cloudW) / 2);
  const cloudY = Math.floor(size * Math.max(0, Math.min(1, boxTopMarginPct)));

  // Fit text to completely fill the available space
  const availableWidth = cloudW * 0.98; // Use almost all available width
  const availableHeight = cloudH * 0.98; // Use almost all available height
  
  // Start with a reasonable font size range
  let minFontPx = 8;
  let maxFontPx = Math.floor(cloudH * 0.5); // Start with a larger maximum
  
  let bestFont = minFontPx;
  let bestLines: string[] = [];
  let bestHeight = 0;
  
  // Binary search for the largest font size that fits
  let lo = minFontPx, hi = maxFontPx;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${mid}px ${fontFamily}`;
    const { lines, height } = measureWrapped(ctx, sanitized, mid, availableWidth, fontFamily);
    
    if (lines.length <= maxLines && height <= availableHeight) {
      // This font size works, try larger
      bestFont = mid;
      bestLines = lines;
      bestHeight = height;
      lo = mid + 1;
    } else {
      // Too big, try smaller
      hi = mid - 1;
    }
  }
  
  // If we still don't have a good fit, force it with minimum font
  if (!bestLines.length) {
    ctx.font = `${minFontPx}px ${fontFamily}`;
    const m = measureWrapped(ctx, sanitized, minFontPx, availableWidth, fontFamily);
    bestLines = m.lines.slice(0, maxLines);
    bestFont = minFontPx;
    bestHeight = bestLines.length * (minFontPx * 1.25);
  }
  
  // Try to scale up if we have extra vertical space
  const extraSpace = availableHeight - bestHeight;
  if (extraSpace > 0 && bestLines.length > 0) {
    const potentialIncrease = Math.floor(extraSpace / bestLines.length);
    if (potentialIncrease > 2) {
      const newFontSize = bestFont + Math.min(potentialIncrease, Math.floor(bestFont * 0.3));
      ctx.font = `${newFontSize}px ${fontFamily}`;
      const testMeasure = measureWrapped(ctx, sanitized, newFontSize, availableWidth, fontFamily);
      if (testMeasure.lines.length <= maxLines && testMeasure.height <= availableHeight) {
        bestFont = newFontSize;
        bestLines = testMeasure.lines;
      }
    }
  }
  
  const best = bestFont;

  // Draw text lines centered without background
  const lineH = best * 1.25;
  const blockH = bestLines.length * lineH;
  const textY = Math.floor(cloudY + (cloudH - blockH) / 2);
  
  // Draw text with subtle stroke for better readability
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${best}px ${fontFamily}`;
  
  let y = textY + lineH / 2;
  const cx = size / 2; // Center horizontally on the canvas
  
  for (const ln of bestLines) {
    // Draw white stroke first for better contrast
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(1, best * 0.05);
    ctx.strokeText(ln, cx, y);
    
    // Draw main text
    ctx.fillStyle = color;
    ctx.fillText(ln, cx, y);
    
    y += lineH;
  }

  return canvas.toDataURL('image/png');
}
