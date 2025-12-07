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

  async writeMetadata(folderPath: string): Promise<void> {
    const metadataPath = path.join(folderPath, METADATA_FILENAME);
    const existing = await this.readMetadata(folderPath);

    const metadata: FolderMetadata = {
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}
