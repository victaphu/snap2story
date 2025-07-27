import { supabase } from './supabase';
import { STORAGE_BUCKETS } from '../constants';

export class StorageService {
  static async uploadFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string,
    file: File
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket])
        .upload(path, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }

  static async getPublicUrl(bucket: keyof typeof STORAGE_BUCKETS, path: string): Promise<string> {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async getSignedUrl(
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string,
    expiresIn = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket])
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  }

  static async deleteFile(bucket: keyof typeof STORAGE_BUCKETS, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket])
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  static async deleteFiles(bucket: keyof typeof STORAGE_BUCKETS, paths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket])
        .remove(paths);

      if (error) {
        console.error('Batch delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Batch delete error:', error);
      return false;
    }
  }

  static async listFiles(bucket: keyof typeof STORAGE_BUCKETS, folder: string = '') {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket])
        .list(folder);

      if (error) {
        console.error('List files error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('List files error:', error);
      return null;
    }
  }

  // Hero image specific methods
  static async uploadHeroImage(userId: string, storyId: string, file: File): Promise<string | null> {
    const fileName = `${Date.now()}-${file.name}`;
    const path = `${userId}/${storyId}/${fileName}`;
    
    const uploadPath = await this.uploadFile('HEROES', path, file);
    if (!uploadPath) return null;

    return this.getPublicUrl('HEROES', uploadPath);
  }

  // Story page image specific methods
  static async uploadPageImage(userId: string, storyId: string, pageNum: number, file: File): Promise<string | null> {
    const fileName = `page-${pageNum}-${Date.now()}.${file.name.split('.').pop()}`;
    const path = `${userId}/${storyId}/${fileName}`;
    
    const uploadPath = await this.uploadFile('PAGES', path, file);
    if (!uploadPath) return null;

    return this.getPublicUrl('PAGES', uploadPath);
  }

  // Export/PDF specific methods
  static async uploadExport(userId: string, storyId: string, file: Blob, type: string): Promise<string | null> {
    const fileName = `${storyId}-${type}-${Date.now()}.pdf`;
    const path = `${userId}/${fileName}`;
    
    const fileToUpload = new File([file], fileName, { type: 'application/pdf' });
    const uploadPath = await this.uploadFile('EXPORTS', path, fileToUpload);
    if (!uploadPath) return null;

    return uploadPath; // Return path for signed URL generation
  }
}