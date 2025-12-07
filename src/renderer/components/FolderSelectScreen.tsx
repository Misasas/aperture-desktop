import './FolderSelectScreen.css';

interface FolderSelectScreenProps {
  onSelectFolder: () => void;
}

export default function FolderSelectScreen({ onSelectFolder }: FolderSelectScreenProps) {
  return (
    <div className="folder-select-screen">
      <div className="folder-select-content">
        <img src="../../assets/Aperture.jpg" alt="Aperture" className="folder-select-icon" />
        <h1 className="folder-select-title">Aperture</h1>
        <p className="folder-select-description">
          管理する画像・動画フォルダを選択してください
        </p>
        <button className="folder-select-button" onClick={onSelectFolder}>
          📁 フォルダを選択
        </button>
      </div>
    </div>
  );
}
