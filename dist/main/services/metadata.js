"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const METADATA_FILENAME = '.aperture.json';
class MetadataService {
    async readMetadata(folderPath) {
        const metadataPath = path_1.default.join(folderPath, METADATA_FILENAME);
        try {
            const content = await promises_1.default.readFile(metadataPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async writeMetadata(folderPath, tags) {
        const metadataPath = path_1.default.join(folderPath, METADATA_FILENAME);
        const existing = await this.readMetadata(folderPath);
        const metadata = {
            tags,
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await promises_1.default.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    }
    async getAllTags(rootPath) {
        const tags = new Set();
        await this.collectTags(rootPath, tags);
        return Array.from(tags).sort();
    }
    async collectTags(dirPath, tags) {
        try {
            const metadata = await this.readMetadata(dirPath);
            if (metadata?.tags) {
                metadata.tags.forEach(tag => tags.add(tag));
            }
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    await this.collectTags(path_1.default.join(dirPath, entry.name), tags);
                }
            }
        }
        catch {
            // Ignore errors
        }
    }
    async searchByTag(rootPath, tag) {
        const folders = [];
        await this.findFoldersWithTag(rootPath, tag, folders);
        return folders;
    }
    async findFoldersWithTag(dirPath, tag, results) {
        try {
            const metadata = await this.readMetadata(dirPath);
            if (metadata?.tags?.includes(tag)) {
                results.push(dirPath);
            }
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    await this.findFoldersWithTag(path_1.default.join(dirPath, entry.name), tag, results);
                }
            }
        }
        catch {
            // Ignore errors
        }
    }
}
exports.MetadataService = MetadataService;
//# sourceMappingURL=metadata.js.map