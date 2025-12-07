import { useState, useEffect, useRef } from 'react';
import { FileSystemItem, FileItem } from '@shared/types';
import './GridItem.css';

interface GridItemProps {
  item: FileSystemItem;
  size: { width: number; height: number };
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  index?: number;
  showIndexNumbers?: boolean;
}

export default function GridItem({
  item,
  size,
  onClick,
  onContextMenu,
  onDoubleClick,
  index,
  showIndexNumbers = false,
}: GridItemProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when item is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Stop observing once visible
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01, // Trigger when at least 1% is visible
      }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load thumbnail only when visible
  useEffect(() => {
    if (!isVisible) return;

    if (item.type === 'file' && (item as FileItem).isImage) {
      setLoading(true);
      setError(false);

      window.electronAPI.getThumbnail(item.path)
        .then((thumb: string | null) => {
          setThumbnail(thumb);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    } else if (item.type === 'folder') {
      setLoading(true);
      setError(false);

      window.electronAPI.getFolderThumbnail(item.path)
        .then((thumb: string | null) => {
          setThumbnail(thumb);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [isVisible, item]);

  const isFolder = item.type === 'folder';
  const isVideo = !isFolder && (item as FileItem).isVideo;

  return (
    <div
      ref={itemRef}
      className="grid-item"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="grid-item-thumb"
        style={{ height: `${size.height}px` }}
      >
        {loading ? (
          <div className="grid-item-loading">
            <div className="spinner-small" />
          </div>
        ) : isFolder && !thumbnail ? (
          <div className="grid-item-folder">
            <span className="grid-item-folder-icon">📁</span>
          </div>
        ) : isFolder && thumbnail ? (
          <img
            src={`file://${thumbnail}`}
            alt={item.name}
            className="grid-item-image"
            draggable={false}
          />
        ) : isVideo ? (
          <div className="grid-item-video">
            <span className="grid-item-video-icon">🎬</span>
            <div className="grid-item-video-overlay">▶</div>
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
          {showIndexNumbers && item.type === 'file' && index !== undefined ? `${index + 1}` : item.name}
        </div>
      </div>
    </div>
  );
}
