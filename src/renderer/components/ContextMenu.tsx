import { useState, useRef, useEffect } from 'react';
import { FileSystemItem } from '@shared/types';
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
  const [renameValue, setRenameValue] = useState('');
  const [fileExtension, setFileExtension] = useState('');

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
      if (item.type === 'file') {
        // Extract filename without extension for files
        const lastDotIndex = item.name.lastIndexOf('.');
        if (lastDotIndex > 0) {
          const nameWithoutExt = item.name.substring(0, lastDotIndex);
          const ext = item.name.substring(lastDotIndex);
          setRenameValue(nameWithoutExt);
          setFileExtension(ext);
        } else {
          setRenameValue(item.name);
          setFileExtension('');
        }
      } else {
        // For folders, use full name
        setRenameValue(item.name);
        setFileExtension('');
      }
      setShowRenameInput(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (item && renameValue.trim()) {
      const newName = item.type === 'file' && fileExtension
        ? renameValue.trim() + fileExtension
        : renameValue.trim();

      if (newName !== item.name) {
        await fileOps.renameItem(item.path, newName);
      }
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


  const handleOpenInExplorer = () => {
    const path = item?.path || currentPath;
    window.electronAPI.openInExplorer(path);
    onClose();
  };

  // Render rename input as modal
  if (showRenameInput) {
    return (
      <>
        <div className="modal-overlay" onClick={onClose} />
        <div
          ref={menuRef}
          className="rename-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rename-modal-header">名前を変更</div>
          <div className="rename-modal-body">
            <div className="rename-modal-input-wrapper">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') onClose();
                }}
                autoFocus
                className="rename-modal-input"
              />
              {fileExtension && (
                <span className="rename-modal-extension">{fileExtension}</span>
              )}
            </div>
          </div>
          <div className="rename-modal-actions">
            <button onClick={onClose} className="rename-modal-btn rename-modal-btn-cancel">キャンセル</button>
            <button onClick={handleRenameSubmit} className="rename-modal-btn rename-modal-btn-ok">OK</button>
          </div>
        </div>
      </>
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
