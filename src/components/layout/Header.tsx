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
  CloudIcon,
  CloudOffIcon,
  LoaderCircleIcon,
  LogInIcon,
  LogOutIcon,
} from 'lucide-react';
import logoSvg from '../../assets/logo.svg';
import { useCanvasStore, useProjectStore, useHistoryStore, useSettingsStore, useCanvasRefStore } from '../../stores';
import { exportToPdf } from '../../utils/exportPdf';
import { undo, redo } from '../../stores/history';
import { parseProjectFile, serializeProject } from '../../utils/projectFile';
import { currentPlan, optionsForSave, replaceAllTabs } from '../../stores/tabs';
import { useToast } from '../Toast';
import { authClient } from '../../lib/auth';
import { useCloudStore } from '../../stores/cloudStore';
import { detachCloudProject, signIn, signOut } from '../../stores/cloudSync';
import { ProjectsDialog } from './ProjectsDialog';

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
  const [showProjects, setShowProjects] = useState(false);
  const { email, status } = useCloudStore();

  const handleSaveName = () => {
    setProjectName(editedName);
    setIsEditingName(false);
  };

  const handleNewProject = () => {
    if (confirm(t('confirmNewProject'))) {
      detachCloudProject();
      clearProject();
      replaceAllTabs([{ name: `${t('defaultOptionName')} 1`, plan: currentPlan() }], 0);
    }
  };

  const handleSaveProject = () => {
    const state = useProjectStore.getState();
    const { options, activeOption } = optionsForSave();
    const data = serializeProject(state.name, options, activeOption);
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
        const { name, options, activeOption } = parseProjectFile(JSON.parse(text), t('defaultOptionName'));
        detachCloudProject();
        replaceAllTabs(options, activeOption);
        if (name) {
          setProjectName(name);
        }
      } catch {
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
          onClick={undo}
          disabled={!canUndo}
          className="p-2 hover:bg-header-hover rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={`${t('undo')} (Ctrl+Z)`}
        >
          <Undo2Icon className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
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

      {/* Cloud (FDD-0008) */}
      {authClient && (
        <>
          <div className="w-px h-6 bg-line-header" />
          <div className="flex items-center gap-2 text-xs">
            {status === 'saving' && (
              <span className="flex items-center gap-1 text-ink-faint">
                <LoaderCircleIcon className="w-3.5 h-3.5 animate-spin" />
                {t('cloudSaving')}
              </span>
            )}
            {status === 'saved' && (
              <span className="flex items-center gap-1 text-ink-faint">
                <CloudIcon className="w-3.5 h-3.5" />
                {t('cloudSaved')}
              </span>
            )}
            {status === 'offline' && (
              <span className="flex items-center gap-1 text-amber-400">
                <CloudOffIcon className="w-3.5 h-3.5" />
                {t('cloudOffline')}
              </span>
            )}
            {status === 'denied' && <span className="text-red-300">{t('cloudAccessDenied')}</span>}
            {email ? (
              <>
                <button onClick={() => setShowProjects(true)} className="px-2 py-1 hover:bg-header-hover rounded">
                  {t('myProjects')}
                </button>
                <button onClick={signOut} className="p-2 hover:bg-header-hover rounded" title={`${t('signOut')} (${email})`}>
                  <LogOutIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={signIn} className="flex items-center gap-1 px-2 py-1 hover:bg-header-hover rounded">
                <LogInIcon className="w-4 h-4" />
                {t('signIn')}
              </button>
            )}
          </div>
        </>
      )}
      {showProjects && <ProjectsDialog onClose={() => setShowProjects(false)} />}

      {/* Help */}
      <button className="p-2 hover:bg-header-hover rounded" title={t('help')}>
        <HelpCircleIcon className="w-4 h-4" />
      </button>
    </header>
  );
}
