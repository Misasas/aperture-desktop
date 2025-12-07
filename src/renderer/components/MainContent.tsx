import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FileSystemItem, thumbnailSizes } from '@shared/types';
import GridItem from './GridItem';
import './MainContent.css';

interface MainContentProps {
  items: FileSystemItem[];
  currentPath: string | null;
  rootFolder: string;
  loading: boolean;
  thumbnailSize: 'S' | 'M' | 'L';
  sortBy: 'name' | 'modifiedAt';
  sortOrder: 'asc' | 'desc';
  showIndexNumbers: boolean;
  onItemClick: (item: FileSystemItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileSystemItem | null) => void;
  onNavigate: (path: string) => void;
  fileOps: {
    createFolder: (parentPath: string, name?: string) => Promise<string>;
    copyFiles: (sourcePaths: string[], destFolder: string) => Promise<string[]>;
  };
}

export default function MainContent({
  items,
  currentPath,
  rootFolder,
  loading,
  thumbnailSize,
  sortBy,
  sortOrder,
  showIndexNumbers,
  onItemClick,
  onContextMenu,
  onNavigate,
  fileOps,
}: MainContentProps) {
  const [displayCount, setDisplayCount] = useState(50);
  const [isDragOver, setIsDragOver] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // Folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ja', { numeric: true });
      } else {
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, sortBy, sortOrder]);

  // Create file index map (only for files, sorted by name ascending)
  const fileIndexMap = useMemo(() => {
    const files = items.filter(item => item.type === 'file');
    const sortedFiles = [...files].sort((a, b) =>
      a.name.localeCompare(b.name, 'ja', { numeric: true })
    );

    const map = new Map<string, number>();
    sortedFiles.forEach((file, index) => {
      map.set(file.path, index);
    });

    return map;
  }, [items]);

  // Infinite scroll - display items
  const displayedItems = useMemo(() => {
    return sortedItems.slice(0, displayCount);
  }, [sortedItems, displayCount]);

  // Reset display count when path changes
  useEffect(() => {
    setDisplayCount(50);
  }, [currentPath]);

  // Infinite scroll handler
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 300; // Load more when 300px from bottom

      if (scrollHeight - scrollTop - clientHeight < threshold && displayCount < sortedItems.length) {
        setDisplayCount(prev => Math.min(prev + 50, sortedItems.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [displayCount, sortedItems.length]);

  // Breadcrumb
  const breadcrumbs = useMemo(() => {
    if (!currentPath || !rootFolder) return [];

    const parts: { name: string; path: string }[] = [];
    const rootName = rootFolder.split(/[\\/]/).pop() || 'ホーム';
    parts.push({ name: rootName, path: rootFolder });

    if (currentPath !== rootFolder) {
      const relativePath = currentPath.slice(rootFolder.length);
      const pathParts = relativePath.split(/[\\/]/).filter(Boolean);
      let accPath = rootFolder;

      for (const part of pathParts) {
        accPath = `${accPath}\\${part}`;
        parts.push({ name: part, path: accPath });
      }
    }

    return parts;
  }, [currentPath, rootFolder]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show overlay for external file drops (not internal drags from sidebar)
    const hasFiles = e.dataTransfer.types.includes('Files');
    setIsDragOver(hasFiles);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!currentPath) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const paths = files.map(f => f.path);
      await fileOps.copyFiles(paths, currentPath);
    }
  }, [currentPath, fileOps]);

  const thumbSize = thumbnailSizes[thumbnailSize];

  return (
    <div
      className={`main-content ${isDragOver ? 'main-content-dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('grid-container')) {
          onContextMenu(e, null);
        }
      }}
    >
      {/* Header */}
      <div className="main-header">
        <div className="breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              <button
                className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'breadcrumb-item-current' : ''}`}
                onClick={() => onNavigate(crumb.path)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="main-grid-container" ref={gridContainerRef}>
        {loading ? (
          <div className="main-loading">
            <div className="spinner" />
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="main-empty">
            <div className="main-empty-icon">📂</div>
            <div className="main-empty-text">このフォルダは空です</div>
            <div className="main-empty-hint">
              ファイルをドラッグ&ドロップして追加
            </div>
          </div>
        ) : (
          <div
            className="grid-container"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${thumbSize.width}px, 1fr))`,
            }}
          >
            {displayedItems.map((item) => (
              <GridItem
                key={item.path}
                item={item}
                size={thumbSize}
                index={item.type === 'file' ? fileIndexMap.get(item.path) : undefined}
                showIndexNumbers={showIndexNumbers}
                onClick={() => onItemClick(item)}
                onContextMenu={(e) => onContextMenu(e, item)}
                onDoubleClick={() => {
                  if (item.type === 'folder') {
                    onNavigate(item.path);
                  } else {
                    onItemClick(item);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <span className="drag-overlay-icon">📥</span>
            <span className="drag-overlay-text">ここにドロップして追加</span>
          </div>
        </div>
      )}
    </div>
  );
}
