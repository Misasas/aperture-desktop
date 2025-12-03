import React, { useState, useEffect, useCallback } from 'react';
import { useSettings, useFileSystem, useFileOperations } from './hooks/useApp';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Viewer from './components/Viewer';
import FolderSelectScreen from './components/FolderSelectScreen';
import ContextMenu from './components/ContextMenu';
import { FileSystemItem, FileItem } from '@shared/types';
import './styles/App.css';

export interface ContextMenuState {
  x: number;
  y: number;
  item: FileSystemItem | null;
  type: 'item' | 'empty';
}

export default function App() {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const {
    currentPath,
    items,
    treeItems,
    loading,
    navigate,
    navigateUp,
    refresh,
    loadTree,
  } = useFileSystem(settings.rootFolder);

  const fileOps = useFileOperations(refresh);

  // Viewer state
  const [viewerItem, setViewerItem] = useState<FileItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(settings.sidebar.width);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(settings.sidebar.collapsed);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Update sidebar settings
  useEffect(() => {
    if (!settingsLoading) {
      setSidebarWidth(settings.sidebar.width);
      setSidebarCollapsed(settings.sidebar.collapsed);
    }
  }, [settings.sidebar, settingsLoading]);

  // Handle folder selection
  const handleSelectRootFolder = async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      await updateSettings({ rootFolder: folder });
    }
  };

  // Handle sidebar resize
  const handleSidebarResize = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const handleSidebarResizeEnd = useCallback((width: number) => {
    updateSettings({ sidebar: { ...settings.sidebar, width } });
  }, [settings.sidebar, updateSettings]);

  // Handle sidebar collapse
  const handleSidebarToggle = useCallback(() => {
    const collapsed = !sidebarCollapsed;
    setSidebarCollapsed(collapsed);
    updateSettings({ sidebar: { ...settings.sidebar, collapsed } });
  }, [sidebarCollapsed, settings.sidebar, updateSettings]);

  // Handle item click
  const handleItemClick = useCallback((item: FileSystemItem) => {
    if (item.type === 'folder') {
      navigate(item.path);
    } else {
      const fileItems = items.filter((i): i is FileItem => i.type === 'file');
      const index = fileItems.findIndex((f) => f.path === item.path);
      setViewerItem(item);
      setViewerIndex(index >= 0 ? index : 0);
    }
  }, [items, navigate]);

  // Handle item double click in sidebar
  const handleTreeItemClick = useCallback((item: FileSystemItem) => {
    if (item.type === 'folder') {
      navigate(item.path);
    } else {
      handleItemClick(item);
    }
  }, [navigate, handleItemClick]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileSystemItem | null) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type: item ? 'item' : 'empty',
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle viewer navigation
  const handleViewerPrev = useCallback(() => {
    const fileItems = items.filter((i): i is FileItem => i.type === 'file');
    if (viewerIndex > 0) {
      setViewerIndex(viewerIndex - 1);
      setViewerItem(fileItems[viewerIndex - 1]);
    }
  }, [items, viewerIndex]);

  const handleViewerNext = useCallback(() => {
    const fileItems = items.filter((i): i is FileItem => i.type === 'file');
    if (viewerIndex < fileItems.length - 1) {
      setViewerIndex(viewerIndex + 1);
      setViewerItem(fileItems[viewerIndex + 1]);
    }
  }, [items, viewerIndex]);

  const handleViewerClose = useCallback(() => {
    setViewerItem(null);
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Backspace') {
        navigateUp();
      } else if (e.key === 'F5') {
        refresh();
      } else if (e.ctrlKey && e.key === 'b') {
        handleSidebarToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateUp, refresh, handleSidebarToggle]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  // Show folder select screen if no root folder
  if (settingsLoading) {
    return (
      <div className="app">
        <TitleBar />
        <div className="app-loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!settings.rootFolder) {
    return (
      <div className="app">
        <TitleBar />
        <FolderSelectScreen onSelectFolder={handleSelectRootFolder} />
      </div>
    );
  }

  const fileItems = items.filter((i): i is FileItem => i.type === 'file');

  return (
    <div className="app">
      <TitleBar onSelectFolder={handleSelectRootFolder} />
      
      <div className="app-body">
        <Sidebar
          width={sidebarWidth}
          collapsed={sidebarCollapsed}
          items={treeItems}
          currentPath={currentPath}
          rootFolder={settings.rootFolder}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onItemClick={handleTreeItemClick}
          onContextMenu={handleContextMenu}
          onResize={handleSidebarResize}
          onResizeEnd={handleSidebarResizeEnd}
          onToggle={handleSidebarToggle}
          onRefresh={loadTree}
        />

        <MainContent
          items={items}
          currentPath={currentPath}
          rootFolder={settings.rootFolder}
          loading={loading}
          thumbnailSize={settings.display.thumbnailSize}
          sortBy={settings.display.sortBy}
          sortOrder={settings.display.sortOrder}
          itemsPerPage={settings.display.itemsPerPage}
          onItemClick={handleItemClick}
          onContextMenu={handleContextMenu}
          onNavigate={navigate}
          onNavigateUp={navigateUp}
          onSettingsChange={(display) => updateSettings({ display: { ...settings.display, ...display } })}
          fileOps={fileOps}
        />
      </div>

      {viewerItem && (
        <Viewer
          item={viewerItem}
          currentIndex={viewerIndex}
          totalCount={fileItems.length}
          onPrev={handleViewerPrev}
          onNext={handleViewerNext}
          onClose={handleViewerClose}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          type={contextMenu.type}
          currentPath={currentPath!}
          onClose={closeContextMenu}
          fileOps={fileOps}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
