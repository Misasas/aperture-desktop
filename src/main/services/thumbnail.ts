import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { imageExtensions } from '../../shared/types';

const THUMBNAIL_SIZE = 480;

export class ThumbnailService {
  private cacheDir: string;

  constructor(userDataPath: string) {
    this.cacheDir = path.join(userDataPath, 'thumbnails');
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  private getHashedPath(filePath: string): string {
    const hash = crypto.createHash('sha256').update(filePath).digest('hex');
    const subDir = hash.substring(0, 2);
    return path.join(this.cacheDir, subDir, `${hash}.webp`);
  }

  async getThumbnail(filePath: string): Promise<string | null> {
    const ext = path.extname(filePath).toLowerCase();
    
    // Only process images for now
    if (!imageExtensions.includes(ext)) {
      // For videos, return null (frontend will show placeholder)
      return null;
    }

    const cachePath = this.getHashedPath(filePath);

    try {
      // Check if cached thumbnail exists and is newer than source
      const [cacheStats, sourceStats] = await Promise.all([
        fs.stat(cachePath).catch(() => null),
        fs.stat(filePath),
      ]);

      if (cacheStats && cacheStats.mtime > sourceStats.mtime) {
        // Return cached thumbnail as data URL
        const data = await fs.readFile(cachePath);
        return `data:image/webp;base64,${data.toString('base64')}`;
      }

      // Generate new thumbnail
      const thumbnail = await this.generateThumbnail(filePath);
      
      // Save to cache
      await this.saveThumbnail(cachePath, thumbnail);

      return `data:image/webp;base64,${thumbnail.toString('base64')}`;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  private async generateThumbnail(filePath: string): Promise<Buffer> {
    return sharp(filePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  }

  private async saveThumbnail(cachePath: string, data: Buffer): Promise<void> {
    const dir = path.dirname(cachePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(cachePath, data);
  }

  async clearCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await this.ensureCacheDir();
    } catch (error) {
      console.error('Error clearing thumbnail cache:', error);
      throw error;
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      return await this.getDirSize(this.cacheDir);
    } catch {
      return 0;
    }
  }

  private async getDirSize(dir: string): Promise<number> {
    let size = 0;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          size += await this.getDirSize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          size += stats.size;
        }
      }
    } catch {
      // Ignore errors
    }
    
    return size;
  }
}
