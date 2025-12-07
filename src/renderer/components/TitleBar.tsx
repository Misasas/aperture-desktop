import './TitleBar.css';

interface TitleBarProps {
  onToggleSidebar?: () => void;
  thumbnailSize?: 'S' | 'M' | 'L';
  sortBy?: 'name' | 'modifiedAt';
  sortOrder?: 'asc' | 'desc';
  showIndexNumbers?: boolean;
  onSettingsChange?: (settings: {
    thumbnailSize?: 'S' | 'M' | 'L';
    sortBy?: 'name' | 'modifiedAt';
    sortOrder?: 'asc' | 'desc';
    showIndexNumbers?: boolean;
  }) => void;
}

export default function TitleBar({
  onToggleSidebar,
  thumbnailSize = 'M',
  sortBy = 'name',
  sortOrder = 'asc',
  showIndexNumbers = false,
  onSettingsChange,
}: TitleBarProps) {
  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        {onToggleSidebar && (
          <button
            className="titlebar-sidebar-toggle"
            onClick={onToggleSidebar}
            title="サイドバーを切り替え"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="18" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        )}
      </div>

      <div className="titlebar-drag-left" />

      <div className="titlebar-center">
        {onSettingsChange && (
          <>
            <div className="titlebar-size-btns">
              {(['S', 'M', 'L'] as const).map((size) => (
                <button
                  key={size}
                  className={`titlebar-size-btn ${thumbnailSize === size ? 'titlebar-size-btn-active' : ''}`}
                  onClick={() => onSettingsChange({ thumbnailSize: size })}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="titlebar-divider" />

            <select
              className="titlebar-select"
              value={sortBy}
              onChange={(e) => onSettingsChange({ sortBy: e.target.value as 'name' | 'modifiedAt' })}
            >
              <option value="name">名前</option>
              <option value="modifiedAt">更新日</option>
            </select>

            <button
              className="titlebar-sort-btn"
              onClick={() => onSettingsChange({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
              title={sortOrder === 'asc' ? '昇順' : '降順'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            <div className="titlebar-divider" />

            <button
              className={`titlebar-index-btn ${showIndexNumbers ? 'titlebar-index-btn-active' : ''}`}
              onClick={() => onSettingsChange({ showIndexNumbers: !showIndexNumbers })}
              title={showIndexNumbers ? 'ファイル名を表示' : 'インデックス番号を表示'}
            >
              {showIndexNumbers ? '#' : 'ABC'}
            </button>
          </>
        )}
      </div>

      <div className="titlebar-drag-right" />

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
