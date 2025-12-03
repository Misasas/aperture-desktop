export declare class ThumbnailService {
    private cacheDir;
    constructor(userDataPath: string);
    private ensureCacheDir;
    private getHashedPath;
    getThumbnail(filePath: string): Promise<string | null>;
    private generateThumbnail;
    private saveThumbnail;
    clearCache(): Promise<void>;
    getCacheSize(): Promise<number>;
    private getDirSize;
}
//# sourceMappingURL=thumbnail.d.ts.map