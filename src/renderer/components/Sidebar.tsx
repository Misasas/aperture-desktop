import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileSystemItem, FolderItem } from '@shared/types';
import './Sidebar.css';

interface SidebarProps {
  width: number;
  collapsed: boolean;
  items: FileSystemItem[];
  currentPath: string | null;
  rootFolder: string;
  searchQuery: string;
  onSearch: (query: string) => void;
  onItemClick: (item: FileSystemItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileSystemItem | null) => void;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  onToggle: () => void;
  onRefresh: () => void;
}

export default function Sidebar({
  width,
  collapsed,
  items,
  currentPath,
  rootFolder,
  searchQuery,
  onSearch,
  onItemClick,
  onContextMenu,
  onResize,
  onResizeEnd,
  onToggle,
  onRefresh,
}: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([rootFolder]));
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Expand path to current directory
  useEffect(() => {
    if (currentPath && rootFolder) {
      const newExpanded = new Set(expandedPaths);
      let path = rootFolder;
      newExpanded.add(path);
      
      const relativePath = currentPath.slice(rootFolder.length);
      const parts = relativePath.split(/[\\/]/).filter(Boolean);
      
      for (const part of parts) {
        path = `${path}\\${part}`;
        newExpanded.add(path);
      }
      
      setExpandedPaths(newExpanded);
    }
  }, [currentPath, rootFolder]);

  const toggleExpand = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(150, Math.min(500, startWidthRef.current + delta));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (sidebarRef.current) {
        const finalWidth = sidebarRef.current.offsetWidth;
        onResizeEnd(finalWidth);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize, onResizeEnd]);

  const renderTreeItem = (item: FileSystemItem, depth: number = 0) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedPaths.has(item.path);
    const isActive = item.path === currentPath;
    const hasChildren = isFolder && (item as FolderItem).children && (item as FolderItem).children!.length > 0;

    return (
      <div key={item.path} className="tree-item-wrapper">
        <div
          className={`tree-item ${isActive ? 'tree-item-active' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => onContextMenu(e, item)}
        >
          {isFolder ? (
            <button
              className="tree-expand-btn"
              onClick={(e) => toggleExpand(item.path, e)}
            >
              {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
            </button>
          ) : (
            <span className="tree-expand-placeholder" />
          )}
          <span className="tree-icon">
            {isFolder ? '📁' : item.isVideo ? '🎬' : '🖼️'}
          </span>
          <span className="tree-name truncate">{item.name}</span>
        </div>

        {isFolder && isExpanded && (item as FolderItem).children && (
          <div className="tree-children">
            {(item as FolderItem).children!.map((child) =>
              renderTreeItem(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="sidebar sidebar-collapsed">
        <button className="sidebar-toggle" onClick={onToggle} title="サイドバーを開く">
          ☰
        </button>
      </div>
    );
  }

  const rootName = rootFolder.split(/[\\/]/).pop() || rootFolder;

  return (
    <div
      ref={sidebarRef}
      className="sidebar"
      style={{ width: `${width}px` }}
    >
      <div className="sidebar-header">
        <div className="sidebar-search">
          <span className="sidebar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="sidebar-search-input"
          />
          {searchQuery && (
            <button
              className="sidebar-search-clear"
              onClick={() => onSearch('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-tree" onContextMenu={(e) => onContextMenu(e, null)}>
        <div className="tree-root">
          <div
            className={`tree-item tree-item-root ${currentPath === rootFolder ? 'tree-item-active' : ''}`}
            onClick={() => onItemClick({ name: rootName, path: rootFolder, type: 'folder', modifiedAt: new Date(), tags: [] })}
            onContextMenu={(e) => onContextMenu(e, { name: rootName, path: rootFolder, type: 'folder', modifiedAt: new Date(), tags: [] })}
          >
            <button
              className="tree-expand-btn"
              onClick={(e) => toggleExpand(rootFolder, e)}
            >
              {expandedPaths.has(rootFolder) ? '▼' : '▶'}
            </button>
            <span className="tree-icon">📁</span>
            <span className="tree-name truncate">{rootName}</span>
          </div>

          {expandedPaths.has(rootFolder) && (
            <div className="tree-children">
              {items.map((item) => renderTreeItem(item, 1))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggle} title="サイドバーを閉じる">
          ◀
        </button>
        <button className="sidebar-refresh" onClick={onRefresh} title="更新">
          🔄
        </button>
      </div>

      <div
        className={`sidebar-resizer ${isDragging ? 'sidebar-resizer-active' : ''}`}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
