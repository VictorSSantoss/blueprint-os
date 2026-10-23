import { useState } from 'react';
import {
  FileIcon,
  FolderOpenIcon,
  SaveIcon,
  DownloadIcon,
  Undo2Icon,
  Redo2Icon,
  GridIcon,
  RulerIcon,
  TagIcon,
  HelpCircleIcon,
} from 'lucide-react';
import logoSvg from '../../assets/logo.svg';
import { useCanvasStore, useProjectStore, useHistoryStore, useSettingsStore, useCanvasRefStore } from '../../stores';
import { exportToPdf } from '../../utils/exportPdf';
import { parseSavedLot } from '../../utils/lot';
import { useToast } from '../Toast';

export function Header() {
  const { name, setProjectName, clearProject, rooms, objects } = useProjectStore();
  const { showGrid, showDimensions, showObjectLabels, toggleGrid, toggleDimensions, toggleObjectLabels, setExporting } = useCanvasStore();
  const { canUndo, canRedo } = useHistoryStore();
  const { language, t } = useSettingsStore();
  const stageRef = useCanvasRefStore((state) => state.stageRef);
  const toast = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveName = () => {
    setProjectName(editedName);
    setIsEditingName(false);
  };

  const handleNewProject = () => {
    if (confirm(t('confirmNewProject'))) {
      clearProject();
    }
  };

  const handleSaveProject = () => {
    const state = useProjectStore.getState();
    const data = {
      version: '1.0',
      name: state.name,
      rooms: state.rooms,
      objects: state.objects,
      dimensionLines: state.dimensionLines,
      lot: state.lot,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        useProjectStore.getState().loadProject({
          rooms: data.rooms || [],
          objects: data.objects || [],
          dimensionLines: data.dimensionLines || [],
          lot: parseSavedLot(data.lot),
        });
        if (data.name) {
          setProjectName(data.name);
        }
      } catch (err) {
        toast.error(t('loadError'));
      }
    };
    input.click();
  };

  const handleExportPdf = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExporting(true);

    // Wait for next frame to ensure grid is hidden
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      await exportToPdf(stageRef, {
        projectName: name,
        rooms,
        objects,
        language,
      });
      toast.success(t('pdfExportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('pdfExportError'));
    } finally {
      setExporting(false);
      setIsExporting(false);
    }
  };

  return (
    <header className="h-12 bg-header text-ink-inverse flex items-center px-4 gap-4 border-b border-line-header">
      {/* Logo */}
      <div className="font-bold text-lg flex items-center gap-2 tracking-tight">
        <img src={logoSvg} alt="BlueprintOS" className="w-6 h-6" />
        <span>{t('appName')}</span>
      </div>

      {/* Project name */}
      <div className="flex-1 flex items-center gap-2">
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            className="bg-header-hover px-2 py-1 rounded text-sm text-ink-inverse"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditedName(name);
              setIsEditingName(true);
            }}
            className="text-sm text-ink-faint hover:text-ink-inverse"
          >
            {name}
          </button>
        )}
      </div>

      {/* File actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleNewProject}
          className="p-2 hover:bg-header-hover rounded"
          title={t('newProject')}
        >
          <FileIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleLoadProject}
          className="p-2 hover:bg-header-hover rounded"
          title={t('openProject')}
        >
          <FolderOpenIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleSaveProject}
          className="p-2 hover:bg-header-hover rounded"
          title={t('saveProject')}
        >
          <SaveIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="p-2 hover:bg-header-hover rounded disabled:opacity-50"
          title={`${t('export')} PDF`}
        >
          <DownloadIcon className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <div className="w-px h-6 bg-line-header" />

      {/* Edit actions */}
      <div className="flex items-center gap-1">
        <button
          disabled={!canUndo}
          className="p-2 hover:bg-header-hover rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={`${t('undo')} (Ctrl+Z)`}
        >
          <Undo2Icon className="w-4 h-4" />
        </button>
        <button
          disabled={!canRedo}
          className="p-2 hover:bg-header-hover rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={`${t('redo')} (Ctrl+Shift+Z)`}
        >
          <Redo2Icon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-line-header" />

      {/* View toggles */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleGrid}
          className={`p-2 rounded ${showGrid ? 'bg-header-hover' : 'hover:bg-header-hover'}`}
          title={t('toggleGrid')}
        >
          <GridIcon className="w-4 h-4" />
        </button>
        <button
          onClick={toggleDimensions}
          className={`p-2 rounded ${showDimensions ? 'bg-header-hover' : 'hover:bg-header-hover'}`}
          title={t('toggleDimensions')}
        >
          <RulerIcon className="w-4 h-4" />
        </button>
        <button
          onClick={toggleObjectLabels}
          className={`p-2 rounded ${showObjectLabels ? 'bg-header-hover' : 'hover:bg-header-hover'}`}
          title={t('toggleLabels')}
        >
          <TagIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Help */}
      <button className="p-2 hover:bg-header-hover rounded" title={t('help')}>
        <HelpCircleIcon className="w-4 h-4" />
      </button>
    </header>
  );
}
