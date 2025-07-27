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
      
      // Convert to compressed base64
      const compressedDataUrl = canvas.toDataURL(format, quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
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
      
      // Convert to compressed base64
      const compressedDataUrl = canvas.toDataURL(format, quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

/**
 * Get the size of a base64 string in bytes and MB
 */
export function getBase64Size(base64: string): { bytes: number; mb: number } {
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;
  
  // Calculate size (base64 is ~33% larger than binary)
  const bytes = (base64Data.length * 3) / 4;
  const mb = bytes / (1024 * 1024);
  
  return { bytes, mb };
}