import React from 'react';
import './TitleBar.css';

interface TitleBarProps {
  onSelectFolder?: () => void;
}

export default function TitleBar({ onSelectFolder }: TitleBarProps) {
  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <div className="titlebar-title">
          <span className="titlebar-icon">📷</span>
          <span>Aperture</span>
        </div>
      </div>

      <div className="titlebar-menu">
        {onSelectFolder && (
          <button
            className="titlebar-menu-btn"
            onClick={onSelectFolder}
            title="フォルダを変更"
          >
            📁
          </button>
        )}
      </div>

      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn-minimize"
          onClick={handleMinimize}
          aria-label="最小化"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="5.5" width="8" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn-maximize"
          onClick={handleMaximize}
          aria-label="最大化"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={handleClose}
          aria-label="閉じる"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
