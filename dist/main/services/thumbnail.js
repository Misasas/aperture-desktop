"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThumbnailService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const sharp_1 = __importDefault(require("sharp"));
const types_1 = require("../../shared/types");
const THUMBNAIL_SIZE = 480;
class ThumbnailService {
    cacheDir;
    constructor(userDataPath) {
        this.cacheDir = path_1.default.join(userDataPath, 'thumbnails');
        this.ensureCacheDir();
    }
    async ensureCacheDir() {
        try {
            await promises_1.default.mkdir(this.cacheDir, { recursive: true });
        }
        catch {
            // Directory might already exist
        }
    }
    getHashedPath(filePath) {
        const hash = crypto_1.default.createHash('sha256').update(filePath).digest('hex');
        const subDir = hash.substring(0, 2);
        return path_1.default.join(this.cacheDir, subDir, `${hash}.webp`);
    }
    async getThumbnail(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        // Only process images for now
        if (!types_1.imageExtensions.includes(ext)) {
            // For videos, return null (frontend will show placeholder)
            return null;
        }
        const cachePath = this.getHashedPath(filePath);
        try {
            // Check if cached thumbnail exists and is newer than source
            const [cacheStats, sourceStats] = await Promise.all([
                promises_1.default.stat(cachePath).catch(() => null),
                promises_1.default.stat(filePath),
            ]);
            if (cacheStats && cacheStats.mtime > sourceStats.mtime) {
                // Return cached thumbnail as data URL
                const data = await promises_1.default.readFile(cachePath);
                return `data:image/webp;base64,${data.toString('base64')}`;
            }
            // Generate new thumbnail
            const thumbnail = await this.generateThumbnail(filePath);
            // Save to cache
            await this.saveThumbnail(cachePath, thumbnail);
            return `data:image/webp;base64,${thumbnail.toString('base64')}`;
        }
        catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }
    async generateThumbnail(filePath) {
        return (0, sharp_1.default)(filePath)
            .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
            fit: 'inside',
            withoutEnlargement: true,
        })
            .webp({ quality: 80 })
            .toBuffer();
    }
    async saveThumbnail(cachePath, data) {
        const dir = path_1.default.dirname(cachePath);
        await promises_1.default.mkdir(dir, { recursive: true });
        await promises_1.default.writeFile(cachePath, data);
    }
    async clearCache() {
        try {
            await promises_1.default.rm(this.cacheDir, { recursive: true, force: true });
            await this.ensureCacheDir();
        }
        catch (error) {
            console.error('Error clearing thumbnail cache:', error);
            throw error;
        }
    }
    async getCacheSize() {
        try {
            return await this.getDirSize(this.cacheDir);
        }
        catch {
            return 0;
        }
    }
    async getDirSize(dir) {
        let size = 0;
        try {
            const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path_1.default.join(dir, entry.name);
                if (entry.isDirectory()) {
                    size += await this.getDirSize(entryPath);
                }
                else {
                    const stats = await promises_1.default.stat(entryPath);
                    size += stats.size;
                }
            }
        }
        catch {
            // Ignore errors
        }
        return size;
    }
}
exports.ThumbnailService = ThumbnailService;
//# sourceMappingURL=thumbnail.js.map