import { FolderMetadata } from '../../shared/types';
export declare class MetadataService {
    readMetadata(folderPath: string): Promise<FolderMetadata | null>;
    writeMetadata(folderPath: string, tags: string[]): Promise<void>;
    getAllTags(rootPath: string): Promise<string[]>;
    private collectTags;
    searchByTag(rootPath: string, tag: string): Promise<string[]>;
    private findFoldersWithTag;
}
//# sourceMappingURL=metadata.d.ts.map