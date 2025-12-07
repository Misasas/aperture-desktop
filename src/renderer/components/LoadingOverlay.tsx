import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'フォルダを読み込み中...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-card">
        <div className="loading-overlay-pulse">
          <div className="loading-overlay-pulse-ring" />
          <div className="loading-overlay-pulse-ring" />
          <div className="loading-overlay-pulse-ring" />
          <div className="loading-overlay-pulse-dot" />
        </div>
        <div className="loading-overlay-message">{message}</div>
      </div>
    </div>
  );
}
