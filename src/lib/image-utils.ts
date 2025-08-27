/**
 * Utility functions for image compression and optimization
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compress an image file to reduce size while maintaining quality
 */
export function compressImage(
  file: File, 
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      try {
        // Convert to compressed base64
        const compressedDataUrl = canvas.toDataURL(format, quality);
        resolve(compressedDataUrl);
      } catch (e) {
        // SecurityError: canvas tainted. Fallback to original file as data URL.
        try {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(e);
          reader.readAsDataURL(file);
        } catch {
          reject(e as any);
        }
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    // Use FileReader to ensure same-origin data URL (avoids tainting for local file)
    const reader = new FileReader();
    reader.onload = () => {
      (img as any).crossOrigin = 'anonymous';
      img.src = String(reader.result || '');
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a base64 image string
 */
export function compressBase64Image(
  base64: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  // If input isn't a data URL, avoid canvas (which would taint without CORS)
  if (!base64?.startsWith('data:')) {
    return Promise.resolve(base64);
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      try {
        // Convert to compressed base64
        const compressedDataUrl = canvas.toDataURL(format, quality);
        resolve(compressedDataUrl);
      } catch (e) {
        // Tainted canvas fallback: return original
        resolve(base64);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    (img as any).crossOrigin = 'anonymous';
    img.src = base64;
  });
}

/**
 * Get the size of a base64 string in bytes and MB
 */
export function getBase64Size(base64: string): { bytes: number; mb: number } {
  // Handle undefined/null input
  if (!base64) {
    return { bytes: 0, mb: 0 };
  }
  
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;
  
  // Calculate size (base64 is ~33% larger than binary)
  const bytes = (base64Data.length * 3) / 4;
  const mb = bytes / (1024 * 1024);
  
  return { bytes, mb };
}

/**
 * Pad a base64 image to a square canvas with background fill (whitespace) and return as data URL.
 */
export function padBase64ToSquare(
  base64: string,
  size: number = 512,
  background: string = '#ffffff',
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.9
): Promise<string> {
  // If input isn't a data URL, avoid canvas to prevent tainting
  if (!base64?.startsWith('data:')) {
    return Promise.resolve(base64);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;
      // Fill background
      if (ctx) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
        // Compute scaled fit within square, preserving aspect ratio
        const ratio = Math.min(size / img.width, size / img.height);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const x = Math.round((size - w) / 2);
        const y = Math.round((size - h) / 2);
        ctx.drawImage(img, x, y, w, h);
        try {
          resolve(canvas.toDataURL(format, quality));
        } catch (e) {
          // Tainted canvas fallback: return original
          resolve(base64);
        }
      } else {
        reject(new Error('Canvas context unavailable'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load base64 image'));
    (img as any).crossOrigin = 'anonymous';
    img.src = base64;
  });
}
