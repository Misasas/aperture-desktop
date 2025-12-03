import fs from 'fs/promises';
import path from 'path';
import { FolderMetadata } from '../../shared/types';

const METADATA_FILENAME = '.aperture.json';

export class MetadataService {
  async readMetadata(folderPath: string): Promise<FolderMetadata | null> {
    const metadataPath = path.join(folderPath, METADATA_FILENAME);

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content) as FolderMetadata;
    } catch {
      return null;
    }
  }

  async writeMetadata(folderPath: string, tags: string[]): Promise<void> {
    const metadataPath = path.join(folderPath, METADATA_FILENAME);
    const existing = await this.readMetadata(folderPath);

    const metadata: FolderMetadata = {
      tags,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  async getAllTags(rootPath: string): Promise<string[]> {
    const tags = new Set<string>();
    await this.collectTags(rootPath, tags);
    return Array.from(tags).sort();
  }

  private async collectTags(dirPath: string, tags: Set<string>): Promise<void> {
    try {
      const metadata = await this.readMetadata(dirPath);
      if (metadata?.tags) {
        metadata.tags.forEach(tag => tags.add(tag));
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.collectTags(path.join(dirPath, entry.name), tags);
        }
      }
    } catch {
      // Ignore errors
    }
  }

  async searchByTag(rootPath: string, tag: string): Promise<string[]> {
    const folders: string[] = [];
    await this.findFoldersWithTag(rootPath, tag, folders);
    return folders;
  }

  private async findFoldersWithTag(
    dirPath: string,
    tag: string,
    results: string[]
  ): Promise<void> {
    try {
      const metadata = await this.readMetadata(dirPath);
      if (metadata?.tags?.includes(tag)) {
        results.push(dirPath);
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.findFoldersWithTag(path.join(dirPath, entry.name), tag, results);
        }
      }
    } catch {
      // Ignore errors
    }
  }
}
