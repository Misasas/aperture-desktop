import React, { useState, useRef, useEffect } from 'react';
import { FileSystemItem, FolderItem } from '@shared/types';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  item: FileSystemItem | null;
  type: 'item' | 'empty';
  currentPath: string;
  onClose: () => void;
  fileOps: {
    createFolder: (parentPath: string, name?: string) => Promise<string>;
    renameItem: (oldPath: string, newName: string) => Promise<string>;
    deleteItem: (itemPath: string) => Promise<void>;
    updateTags: (folderPath: string, tags: string[]) => Promise<void>;
  };
  onRefresh: () => void;
}

export default function ContextMenu({
  x,
  y,
  item,
  type,
  currentPath,
  onClose,
  fileOps,
  onRefresh,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [tagValue, setTagValue] = useState('');

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 8 : x;
      const newY = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 8 : y;
      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  const handleCreateFolder = async () => {
    await fileOps.createFolder(currentPath);
    onClose();
  };

  const handleRename = () => {
    if (item) {
      setRenameValue(item.name);
      setShowRenameInput(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (item && renameValue.trim() && renameValue !== item.name) {
      await fileOps.renameItem(item.path, renameValue.trim());
    }
    setShowRenameInput(false);
    onClose();
  };

  const handleDelete = async () => {
    if (item && window.confirm(`"${item.name}" をごみ箱に移動しますか？`)) {
      await fileOps.deleteItem(item.path);
      onClose();
    }
  };

  const handleEditTags = () => {
    if (item && item.type === 'folder') {
      const folder = item as FolderItem;
      setTagValue(folder.tags.join(', '));
      setShowTagInput(true);
    }
  };

  const handleTagSubmit = async () => {
    if (item && item.type === 'folder') {
      const tags = tagValue
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await fileOps.updateTags(item.path, tags);
    }
    setShowTagInput(false);
    onClose();
  };

  const handleOpenInExplorer = () => {
    const path = item?.path || currentPath;
    window.electronAPI.openInExplorer(path);
    onClose();
  };

  const handleOpenWithDefaultApp = () => {
    if (item) {
      window.electronAPI.openWithDefaultApp(item.path);
      onClose();
    }
  };

  // Render rename input
  if (showRenameInput) {
    return (
      <div
        ref={menuRef}
        className="context-menu"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-input">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            placeholder="新しい名前"
          />
          <div className="context-menu-input-actions">
            <button onClick={handleRenameSubmit}>OK</button>
            <button onClick={onClose}>キャンセル</button>
          </div>
        </div>
      </div>
    );
  }

  // Render tag input
  if (showTagInput) {
    return (
      <div
        ref={menuRef}
        className="context-menu"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-input">
          <input
            type="text"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTagSubmit();
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            placeholder="タグをカンマ区切りで入力"
          />
          <div className="context-menu-input-actions">
            <button onClick={handleTagSubmit}>OK</button>
            <button onClick={onClose}>キャンセル</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === 'item' && item ? (
        <>
          {item.type === 'folder' ? (
            <>
              <button className="context-menu-item" onClick={handleEditTags}>
                🏷️ タグを編集
              </button>
              <div className="context-menu-separator" />
            </>
          ) : (
            <>
              <button className="context-menu-item" onClick={handleOpenWithDefaultApp}>
                ▶️ 既定のアプリで開く
              </button>
              <div className="context-menu-separator" />
            </>
          )}
          <button className="context-menu-item" onClick={handleRename}>
            ✏️ 名前を変更
          </button>
          <button className="context-menu-item context-menu-item-danger" onClick={handleDelete}>
            🗑️ 削除
          </button>
          <div className="context-menu-separator" />
          <button className="context-menu-item" onClick={handleOpenInExplorer}>
            📂 エクスプローラーで表示
          </button>
        </>
      ) : (
        <>
          <button className="context-menu-item" onClick={handleCreateFolder}>
            📁 新規フォルダ
          </button>
          <div className="context-menu-separator" />
          <button className="context-menu-item" onClick={onRefresh}>
            🔄 表示を更新
          </button>
          <button className="context-menu-item" onClick={handleOpenInExplorer}>
            📂 エクスプローラーで開く
          </button>
        </>
      )}
    </div>
  );
}
