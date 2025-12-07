import React, { useEffect, useCallback, useState } from 'react';
import { FileItem } from '@shared/types';
import './Viewer.css';

interface ViewerProps {
  item: FileItem;
  currentIndex: number;
  totalCount: number;
  showIndexNumbers?: boolean;
  fileIndex?: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export default function Viewer({
  item,
  currentIndex,
  totalCount,
  showIndexNumbers = false,
  fileIndex,
  onPrev,
  onNext,
  onClose,
}: ViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom when item changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [item]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case ' ':
          if (item.isVideo) {
            const video = document.querySelector('.viewer-video') as HTMLVideoElement;
            if (video) {
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose, onPrev, onNext]);

  // Handle wheel zoom with native event listener
  useEffect(() => {
    if (!item.isImage) return;

    const handleWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent;
      e.preventDefault();
      const delta = wheelEvent.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
    };

    const viewerContent = document.querySelector('.viewer-content');
    if (viewerContent) {
      viewerContent.addEventListener('wheel', handleWheel, { passive: false });
      return () => viewerContent.removeEventListener('wheel', handleWheel);
    }
  }, [item.isImage]);

  // Handle double click to reset/zoom
  const handleDoubleClick = useCallback(() => {
    if (!item.isImage) return;
    
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [item.isImage, scale]);

  // Handle drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!item.isImage || scale <= 1) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [item.isImage, scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // File URL for media
  const fileUrl = `file:///${item.path.replace(/\\/g, '/')}`;

  return (
    <div className="viewer" onClick={onClose}>
      <div className="viewer-header" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-title truncate">
          {showIndexNumbers && fileIndex !== undefined ? `${fileIndex + 1}` : item.name}
        </div>
        <div className="viewer-counter">
          {currentIndex + 1} / {totalCount}
        </div>
        <button className="viewer-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div
        className="viewer-content"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {item.isImage ? (
          <img
            src={fileUrl}
            alt={item.name}
            className="viewer-image"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onDoubleClick={handleDoubleClick}
            draggable={false}
          />
        ) : (
          <video
            src={fileUrl}
            className="viewer-video"
            controls
            autoPlay
          />
        )}
      </div>

      <button
        className="viewer-nav viewer-nav-prev"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={currentIndex === 0}
      >
        ‹
      </button>

      <button
        className="viewer-nav viewer-nav-next"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={currentIndex === totalCount - 1}
      >
        ›
      </button>
    </div>
  );
}
