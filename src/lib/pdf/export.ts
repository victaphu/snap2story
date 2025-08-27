"use client";

// Minimal item type expected by the exporter
export type ExportItem = {
  key: string;
  label: string;
  pageType?: 'blank' | 'text-only' | 'static' | 'generated';
  image?: string;
  staticImagePath?: string;
  storyText?: string;
};

async function ensurePdfLib(): Promise<any> {
  if ((window as any).PDFLib) return (window as any).PDFLib;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load PDF library'));
    document.body.appendChild(s);
  });
  return (window as any).PDFLib;
}

async function fetchBytes(src: string): Promise<Uint8Array> {
  if (!src) return new Uint8Array();
  if (src.startsWith('data:')) {
    const b64 = src.split(',')[1] || '';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  // For external URLs (like CDN), proxy to avoid CORS
  if (src.startsWith('http')) {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const ab = await res.arrayBuffer();
      return new Uint8Array(ab);
    } catch (error) {
      console.warn('Failed to fetch external image, skipping:', src, error);
      return new Uint8Array();
    }
  }

  // Local URL
  try {
    const res = await fetch(src);
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  } catch (error) {
    console.warn('Failed to fetch local image, skipping:', src, error);
    return new Uint8Array();
  }
}

export async function exportBookPdf(items: ExportItem[], opts?: { fileName?: string }) {
  const PDFLib = await ensurePdfLib();
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageSize = 2048; // square, full-bleed

  const drawTextPage = async (txt: string) => {
    const page = pdfDoc.addPage([pageSize, pageSize]);
    const padding = 200;
    const boxWidth = pageSize - padding * 2;
    const words = (txt || '').split(/\s+/);
    const lines: string[] = [];
    const fontSize = 72; // Larger font for children's book
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(test, fontSize) > boxWidth) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const totalHeight = lines.length * (fontSize * 1.5); // Increased line height
    let y = (pageSize - totalHeight) / 2 + (lines.length - 1) * (fontSize * 1.5);
    for (const ln of lines) {
      const tw = font.widthOfTextAtSize(ln, fontSize);
      const x = (pageSize - tw) / 2;
      page.drawText(ln, { x, y, size: fontSize, font, color: rgb(0.176, 0.216, 0.282) });
      y -= fontSize * 1.5;
    }
  };

  const drawImageFullBleed = async (src: string, textOverlay?: string) => {
    const bytes = await fetchBytes(src);
    if (!bytes.length) {
      await drawTextPage(textOverlay || '');
      return;
    }
    let img;
    try {
      img = await pdfDoc.embedPng(bytes);
    } catch {
      img = await pdfDoc.embedJpg(bytes);
    }
    const page = pdfDoc.addPage([pageSize, pageSize]);
    page.drawImage(img, { x: 0, y: 0, width: pageSize, height: pageSize });

    if (textOverlay && textOverlay.trim()) {
      const outerPadding = 100;
      const innerPadding = 32;
      const borderWidth = 8;
      const fontSize = 56;
      const lineHeight = 1.3;
      const maxTextWidth = pageSize * 0.9 - outerPadding * 2 - innerPadding * 2;

      const words = textOverlay.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, fontSize) > maxTextWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const textHeight = lines.length * (fontSize * lineHeight);
      const boxWidth = pageSize * 0.9 - outerPadding * 2;
      const boxHeight = textHeight + innerPadding * 2;
      const boxX = (pageSize - boxWidth) / 2;
      const boxY = outerPadding;

      page.drawRectangle({
        x: boxX - borderWidth,
        y: boxY - borderWidth,
        width: boxWidth + borderWidth * 2,
        height: boxHeight + borderWidth * 2,
        color: rgb(0.886, 0.91, 0.941),
      });

      page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        color: rgb(0.98, 0.98, 0.98),
      });

      const textStartY = boxY + boxHeight - innerPadding - fontSize * 0.8;
      const textCenterX = boxX + boxWidth / 2;
      let currentY = textStartY;
      for (const line of lines) {
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        const textX = textCenterX - textWidth / 2;
        page.drawText(line, { x: textX, y: currentY, size: fontSize, font, color: rgb(0.176, 0.216, 0.282) });
        currentY -= fontSize * lineHeight;
      }
    }
  };

  const drawSideBySidePages = async (leftItem?: ExportItem, rightItem?: ExportItem) => {
    const page = pdfDoc.addPage([pageSize * 2, pageSize]);
    const half = pageSize;

    // Left
    if (leftItem) {
      if (leftItem.pageType === 'blank') {
        const blankText = 'This page intentionally left blank';
        const fontSize = 48;
        const textWidth = font.widthOfTextAtSize(blankText, fontSize);
        const x = (half - textWidth) / 2;
        const y = half / 2;
        page.drawText(blankText, { x, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
      } else if (leftItem.pageType === 'text-only') {
        const padding = 100;
        const boxWidth = half - padding * 2;
        const words = (leftItem.storyText || '').split(/\s+/);
        const lines: string[] = [];
        const fontSize = 56;
        let line = '';
        for (const w of words) {
          const test = line ? line + ' ' + w : w;
          if (font.widthOfTextAtSize(test, fontSize) > boxWidth) {
            if (line) lines.push(line);
            line = w;
          } else line = test;
        }
        if (line) lines.push(line);
        const totalHeight = lines.length * (fontSize * 1.5);
        let y = half - (half - totalHeight) / 2 - fontSize * 0.7;
        for (const ln of lines) {
          const tw = font.widthOfTextAtSize(ln, fontSize);
          const x = padding + (boxWidth - tw) / 2;
          page.drawText(ln, { x, y, size: fontSize, font, color: rgb(0.176, 0.216, 0.282) });
          y -= fontSize * 1.5;
        }
      } else if (leftItem.image || leftItem.staticImagePath) {
        const bytes = await fetchBytes(leftItem.image || leftItem.staticImagePath || '');
        if (bytes.length) {
          let img;
          try { img = await pdfDoc.embedPng(bytes); } catch { img = await pdfDoc.embedJpg(bytes); }
          // Dedication page: render image at 60% height, centered vertically
          if (leftItem.key === 'dedication') {
            const imgHeight = pageSize * 0.6;
            const y = (pageSize - imgHeight) / 2;
            page.drawImage(img, { x: 0, y, width: half, height: imgHeight });
          } else {
            page.drawImage(img, { x: 0, y: 0, width: half, height: pageSize });
          }
        }
      }
    }

    // Right
    if (rightItem && (rightItem.image || rightItem.staticImagePath)) {
      const bytes = await fetchBytes(rightItem.image || rightItem.staticImagePath || '');
      if (bytes.length) {
        let img;
        try { img = await pdfDoc.embedPng(bytes); } catch { img = await pdfDoc.embedJpg(bytes); }
        // Dedication page on right: render image at 60% height, centered vertically
        if (rightItem.key === 'dedication') {
          const imgHeight = pageSize * 0.6;
          const y = (pageSize - imgHeight) / 2;
          page.drawImage(img, { x: half, y, width: half, height: imgHeight });
        } else {
          page.drawImage(img, { x: half, y: 0, width: half, height: pageSize });
        }

        // Optional text overlay on right image
        if (rightItem.storyText && rightItem.storyText.trim()) {
          const outerPadding = 50;
          const innerPadding = 16;
          const borderWidth = 6; // thicker border
          const fontSize = 36;   // larger, friendlier font size
          const lineHeight = 1.3;
          const maxTextWidth = half * 0.9 - outerPadding * 2 - innerPadding * 2;

          const words = rightItem.storyText.split(/\s+/);
          const lines: string[] = [];
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (font.widthOfTextAtSize(testLine, fontSize) > maxTextWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);

          const textHeight = lines.length * (fontSize * lineHeight);
          const boxWidth = half * 0.9 - outerPadding * 2;
          const boxHeight = textHeight + innerPadding * 2;
          const boxX = half + (half - boxWidth) / 2;
          const boxY = outerPadding;

          page.drawRectangle({
            x: boxX - borderWidth,
            y: boxY - borderWidth,
            width: boxWidth + borderWidth * 2,
            height: boxHeight + borderWidth * 2,
            color: rgb(0.886, 0.91, 0.941),
          });

          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            color: rgb(0.98, 0.98, 0.98),
          });

          const textStartY = boxY + boxHeight - innerPadding - fontSize * 0.8;
          const textCenterX = boxX + boxWidth / 2;
          let currentY = textStartY;
          for (const line of lines) {
            const textWidth = font.widthOfTextAtSize(line, fontSize);
            const textX = textCenterX - textWidth / 2;
            page.drawText(line, { x: textX, y: currentY, size: fontSize, font, color: rgb(0.176, 0.216, 0.282) });
            currentY -= fontSize * lineHeight;
          }
        }
      }
    }
  };

  // 1) Cover (single page)
  const coverItem = items.find((i) => i.key === 'cover');
  if (coverItem?.image) {
    await drawImageFullBleed(coverItem.image, '');
  }

  // 2) Remaining items: pairs for spreads, then last 3 static pages as singles
  const remaining = items.slice(1);
  const lastThree = remaining.slice(-3);
  const content = remaining.slice(0, -3);

  for (let i = 0; i < content.length; i += 2) {
    const left = content[i];
    const right = content[i + 1];
    await drawSideBySidePages(left, right);
  }

  for (const item of lastThree) {
    if (item.pageType === 'static') {
      await drawImageFullBleed(item.image || item.staticImagePath || '');
    }
  }

  // Save & auto-download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const defaultName = (items.find((i) => i.key === 'cover')?.label || 'book') + '.pdf';
  a.download = opts?.fileName || defaultName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
