export interface TextOverlayOptions {
  text: string;
  imageBase64: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  cornerRadius?: number;
  position?: 'bottom' | 'top' | 'center';
  maxWidth?: number;
  lineHeight?: number;
}

export async function addTextOverlay(options: TextOverlayOptions): Promise<string> {
  const {
    text,
    imageBase64,
    fontSize = 24,
    fontFamily = 'Comic Sans MS, cursive, fantasy',
    textColor = '#2d3748',
    backgroundColor = 'rgba(255, 255, 255, 0.95)',
    borderColor = '#f7fafc',
    borderWidth = 3,
    padding = 20,
    cornerRadius = 12,
    position = 'bottom',
    maxWidth = 0.85, // 85% of image width
    lineHeight = 1.3,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Calculate text layout
        const textWidth = Math.floor(canvas.width * maxWidth);
        ctx.font = `${fontSize}px ${fontFamily}`;
        
        // Word wrap the text
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > textWidth - (padding * 2) && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        // Calculate text box dimensions
        const lineHeightPx = fontSize * lineHeight;
        const textHeight = lines.length * lineHeightPx;
        const boxWidth = textWidth;
        const boxHeight = textHeight + (padding * 2);
        
        // Calculate position
        let boxX = (canvas.width - boxWidth) / 2;
        let boxY: number;
        
        switch (position) {
          case 'top':
            boxY = padding;
            break;
          case 'center':
            boxY = (canvas.height - boxHeight) / 2;
            break;
          case 'bottom':
          default:
            boxY = canvas.height - boxHeight - padding;
            break;
        }
        
        // Draw children's book style text box with border
        ctx.save();
        
        // Draw outer border (slightly larger)
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.roundRect(boxX - borderWidth, boxY - borderWidth, 
                     boxWidth + (borderWidth * 2), boxHeight + (borderWidth * 2), 
                     cornerRadius + borderWidth);
        ctx.fill();
        
        // Draw inner background
        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);
        ctx.fill();
        
        // Add subtle shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);
        ctx.fill();
        
        ctx.restore();
        
        // Draw text
        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const textStartY = boxY + padding;
        const textCenterX = boxX + boxWidth / 2;
        
        lines.forEach((line, index) => {
          const lineY = textStartY + (index * lineHeightPx);
          ctx.fillText(line, textCenterX, lineY);
        });
        
        // Convert back to base64
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageBase64;
  });
}