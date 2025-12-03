import React, { useState, useEffect } from 'react';
import { FileSystemItem, FolderItem, FileItem } from '@shared/types';
import './GridItem.css';

interface GridItemProps {
  item: FileSystemItem;
  size: { width: number; height: number };
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

export default function GridItem({
  item,
  size,
  onClick,
  onContextMenu,
  onDoubleClick,
}: GridItemProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Load thumbnail for files
  useEffect(() => {
    if (item.type === 'file' && (item as FileItem).isImage) {
      setLoading(true);
      setError(false);
      
      window.electronAPI.getThumbnail(item.path)
        .then((thumb) => {
          setThumbnail(thumb);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [item]);

  const isFolder = item.type === 'folder';
  const isVideo = !isFolder && (item as FileItem).isVideo;
  const tags = isFolder ? (item as FolderItem).tags : [];

  return (
    <div
      className="grid-item"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="grid-item-thumb"
        style={{ height: `${size.height}px` }}
      >
        {isFolder ? (
          <div className="grid-item-folder">
            <span className="grid-item-folder-icon">📁</span>
          </div>
        ) : isVideo ? (
          <div className="grid-item-video">
            <span className="grid-item-video-icon">🎬</span>
            <div className="grid-item-video-overlay">▶</div>
          </div>
        ) : loading ? (
          <div className="grid-item-loading">
            <div className="spinner-small" />
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={item.name}
            className="grid-item-image"
            draggable={false}
          />
        ) : error ? (
          <div className="grid-item-error">
            <span>🖼️</span>
          </div>
        ) : (
          <div className="grid-item-placeholder">
            <span>🖼️</span>
          </div>
        )}
      </div>

      <div className="grid-item-info">
        <div className="grid-item-name truncate" title={item.name}>
          {item.name}
        </div>
        
        {tags.length > 0 && (
          <div className="grid-item-tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="grid-item-tag" title={tag}>
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="grid-item-tag-more">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
