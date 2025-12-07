import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileSystemItem, FolderItem } from '@shared/types';
import './Sidebar.css';

interface SidebarProps {
  width: number;
  collapsed: boolean;
  items: FileSystemItem[];
  currentPath: string | null;
  rootFolder: string;
  folderHistory: string[];
  onItemClick: (item: FileSystemItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileSystemItem | null) => void;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  onToggle: () => void;
  onMoveItem: (sourcePath: string, destFolder: string) => Promise<string>;
  onSelectFolder: () => void;
  onSwitchFolder: (folderPath: string) => void;
  onRemoveFromHistory: (folderPath: string) => void;
}

export default function Sidebar({
  width,
  collapsed,
  items,
  currentPath,
  rootFolder,
  folderHistory,
  onItemClick,
  onContextMenu,
  onResize,
  onResizeEnd,
  onToggle,
  onMoveItem,
  onSelectFolder,
  onSwitchFolder,
  onRemoveFromHistory,
}: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([rootFolder]));
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FileSystemItem | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredHistoryItem, setHoveredHistoryItem] = useState<string | null>(null);
  const [isTreeDragOver, setIsTreeDragOver] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: FileSystemItem) => {
    if (item.type === 'folder') {
      e.stopPropagation();
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, item: FileSystemItem) => {
    if (item.type === 'folder' && draggedItem && draggedItem.path !== item.path) {
      e.preventDefault();
      e.stopPropagation();
      setDragOverPath(item.path);
    }
  }, [draggedItem]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverPath(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetItem: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem && targetItem.type === 'folder' && draggedItem.path !== targetItem.path) {
      // Check if trying to move to a child folder
      if (!targetItem.path.startsWith(draggedItem.path)) {
        await onMoveItem(draggedItem.path, targetItem.path);
      }
    }

    setDraggedItem(null);
    setDragOverPath(null);
  }, [draggedItem, onMoveItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverPath(null);
  }, []);

  // Dropdown handlers
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(prev => !prev);
  }, []);

  const handleFolderSelect = useCallback((folderPath: string) => {
    setShowDropdown(false);
    onSwitchFolder(folderPath);
  }, [onSwitchFolder]);

  const handleNewFolder = useCallback(() => {
    setShowDropdown(false);
    onSelectFolder();
  }, [onSelectFolder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Get folder name from path
  const getFolderName = useCallback((folderPath: string) => {
    const parts = folderPath.split(/[\\/]/).filter(Boolean);
    return parts[parts.length - 1] || folderPath;
  }, []);

  // Handle delete history item
  const handleDeleteHistory = useCallback((e: React.MouseEvent, folderPath: string) => {
    e.stopPropagation();
    setHoveredHistoryItem(null);
    onRemoveFromHistory(folderPath);
  }, [onRemoveFromHistory]);

  // Handle drag over sidebar-tree (for root drop)
  const handleTreeDragOver = useCallback((e: React.DragEvent) => {
    // Only handle if dragging a folder and not over a tree-item
    if (draggedItem && !(e.target as HTMLElement).closest('.tree-item')) {
      e.preventDefault();
      e.stopPropagation();
      setIsTreeDragOver(true);
    }
  }, [draggedItem]);

  const handleTreeDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setIsTreeDragOver(false);
  }, []);

  const handleTreeDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem && !(e.target as HTMLElement).closest('.tree-item')) {
      // Move to root folder
      await onMoveItem(draggedItem.path, rootFolder);
    }

    setIsTreeDragOver(false);
    setDraggedItem(null);
    setDragOverPath(null);
  }, [draggedItem, onMoveItem, rootFolder]);

  const renderTreeItem = (item: FileSystemItem, depth: number = 0) => {
    // Only show folders in sidebar
    if (item.type !== 'folder') {
      return null;
    }

    const isExpanded = expandedPaths.has(item.path);
    const isActive = item.path === currentPath;
    const isDragOver = dragOverPath === item.path;
    const isDraggingThis = draggedItem?.path === item.path;
    const folderItem = item as FolderItem;
    const folderChildren = folderItem.children ? folderItem.children.filter(child => child.type === 'folder') : [];
    const hasChildren = folderChildren.length > 0;

    return (
      <div key={item.path} className="tree-item-wrapper">
        <div
          className={`tree-item ${isActive ? 'tree-item-active' : ''} ${isDragOver ? 'tree-item-drag-over' : ''} ${isDraggingThis ? 'tree-item-dragging' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          draggable
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => onContextMenu(e, item)}
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item)}
          onDragEnd={handleDragEnd}
        >
          <button
            className="tree-expand-btn"
            onClick={(e) => toggleExpand(item.path, e)}
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
          </button>
          <span className="tree-icon">📁</span>
          <span className="tree-name truncate">{item.name}</span>
        </div>

        {isExpanded && folderChildren.length > 0 && (
          <div className="tree-children">
            {folderChildren.map((child) =>
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

  return (
    <div
      ref={sidebarRef}
      className="sidebar"
      style={{ width: `${width}px` }}
    >
      <div
        className={`sidebar-tree ${draggedItem ? 'sidebar-tree-dragging' : ''} ${isTreeDragOver ? 'sidebar-tree-drag-over' : ''}`}
        onContextMenu={(e) => onContextMenu(e, null)}
        onDragOver={handleTreeDragOver}
        onDragLeave={handleTreeDragLeave}
        onDrop={handleTreeDrop}
      >
        {items.filter(item => item.type === 'folder').map((item) => renderTreeItem(item, 0))}
      </div>

      <div className="sidebar-footer" ref={dropdownRef}>
        <button
          className="sidebar-footer-btn"
          onClick={toggleDropdown}
          title={rootFolder}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="sidebar-footer-btn-text truncate">{getFolderName(rootFolder)}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" className="sidebar-footer-arrow">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        {showDropdown && (
          <div className="sidebar-dropdown">
            {folderHistory.length > 0 && (
              <>
                {folderHistory.map((folderPath) => (
                  <div
                    key={folderPath}
                    className={`sidebar-dropdown-item ${folderPath === rootFolder ? 'sidebar-dropdown-item-active' : ''}`}
                    onMouseEnter={() => setHoveredHistoryItem(folderPath)}
                    onMouseLeave={() => setHoveredHistoryItem(null)}
                  >
                    <button
                      className="sidebar-dropdown-item-btn"
                      onClick={() => handleFolderSelect(folderPath)}
                      title={folderPath}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="sidebar-dropdown-item-text truncate">{getFolderName(folderPath)}</span>
                    </button>
                    {hoveredHistoryItem === folderPath && (
                      <button
                        className="sidebar-dropdown-item-delete"
                        onClick={(e) => handleDeleteHistory(e, folderPath)}
                        title="履歴から削除"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <div className="sidebar-dropdown-divider" />
              </>
            )}
            <button
              className="sidebar-dropdown-item sidebar-dropdown-item-new"
              onClick={handleNewFolder}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="10" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="sidebar-dropdown-item-text">新しいフォルダを開く...</span>
            </button>
          </div>
        )}
      </div>

      <div
        className={`sidebar-resizer ${isDragging ? 'sidebar-resizer-active' : ''}`}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
