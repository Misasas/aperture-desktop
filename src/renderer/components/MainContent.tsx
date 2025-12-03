import React, { useState, useMemo, useCallback } from 'react';
import { FileSystemItem, FolderItem, thumbnailSizes } from '@shared/types';
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
  itemsPerPage: number;
  onItemClick: (item: FileSystemItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileSystemItem | null) => void;
  onNavigate: (path: string) => void;
  onNavigateUp: () => void;
  onSettingsChange: (settings: {
    thumbnailSize?: 'S' | 'M' | 'L';
    sortBy?: 'name' | 'modifiedAt';
    sortOrder?: 'asc' | 'desc';
    itemsPerPage?: number;
  }) => void;
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
  itemsPerPage,
  onItemClick,
  onContextMenu,
  onNavigate,
  onNavigateUp,
  onSettingsChange,
  fileOps,
}: MainContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  // Reset page when items change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [currentPath]);

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
    setIsDragOver(true);
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

  const handleAddFiles = useCallback(async () => {
    // This would typically open a file dialog
    // For now, we rely on drag & drop
  }, []);

  const handleCreateFolder = useCallback(async () => {
    if (currentPath) {
      await fileOps.createFolder(currentPath);
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
          {currentPath !== rootFolder && (
            <button className="breadcrumb-back" onClick={onNavigateUp} title="戻る">
              ←
            </button>
          )}
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

      {/* Toolbar */}
      <div className="main-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-size-btns">
            {(['S', 'M', 'L'] as const).map((size) => (
              <button
                key={size}
                className={`toolbar-btn ${thumbnailSize === size ? 'toolbar-btn-active' : ''}`}
                onClick={() => onSettingsChange({ thumbnailSize: size })}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => onSettingsChange({ sortBy: e.target.value as 'name' | 'modifiedAt' })}
          >
            <option value="name">名前</option>
            <option value="modifiedAt">更新日</option>
          </select>

          <button
            className="toolbar-btn"
            onClick={() => onSettingsChange({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
            title={sortOrder === 'asc' ? '昇順' : '降順'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <div className="toolbar-divider" />

          <select
            className="toolbar-select"
            value={itemsPerPage}
            onChange={(e) => onSettingsChange({ itemsPerPage: parseInt(e.target.value) })}
          >
            <option value={20}>20件</option>
            <option value={50}>50件</option>
            <option value={100}>100件</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn toolbar-btn-primary" onClick={handleCreateFolder}>
            📁+ 新規フォルダ
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="main-grid-container">
        {loading ? (
          <div className="main-loading">
            <div className="spinner" />
          </div>
        ) : paginatedItems.length === 0 ? (
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
            {paginatedItems.map((item) => (
              <GridItem
                key={item.path}
                item={item}
                size={thumbSize}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="main-pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ←
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 2) return true;
                return false;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    className={`pagination-btn ${currentPage === page ? 'pagination-btn-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            →
          </button>

          <span className="pagination-info">
            全{sortedItems.length}件
          </span>
        </div>
      )}

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
