import { useMemo } from 'react';
import { AppLayout } from './components/layout';
import { FloorCanvas } from './components/canvas/FloorCanvas';
import { ObjectLibrary } from './components/panels/ObjectLibrary';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CanvasErrorFallback } from './components/canvas/CanvasErrorFallback';
import { ToastContainer } from './components/Toast';
import { useKeyboardShortcuts, type KeyboardShortcut, type KeyboardShortcutOnKeyUp } from './hooks';
import { useToolStore, useSelectionStore, useProjectStore, useCanvasStore } from './stores';
import { undo, redo } from './stores/history';

function App() {
  const { setMode, mode } = useToolStore();
  const { selectedIds, clearSelection } = useSelectionStore();
  const { deleteObjects, duplicateObjects, rotateObjects } = useProjectStore();
  const { zoomIn, zoomOut, resetView } = useCanvasStore();

  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      // Tool shortcuts
      { key: 'v', action: () => setMode('select') },
      { key: 'r', action: () => setMode('draw-room') },
      { key: ' ', action: () => mode !== 'pan' && setMode('pan') },

      // Undo / redo (FDD-0006); Ctrl also matches ⌘ on Mac
      { key: 'z', modifiers: { ctrl: true }, action: undo },
      { key: 'z', modifiers: { ctrl: true, shift: true }, action: redo },
      { key: 'y', modifiers: { ctrl: true }, action: redo },

      // Zoom shortcuts
      { key: '+', action: zoomIn },
      { key: '=', action: zoomIn },
      { key: '-', action: zoomOut },
      { key: '0', action: resetView },

      // Delete selected
      {
        key: 'Delete',
        action: () => {
          if (selectedIds.length > 0) {
            deleteObjects(selectedIds);
            clearSelection();
          }
        },
        enabled: selectedIds.length > 0,
      },
      {
        key: 'Backspace',
        action: () => {
          if (selectedIds.length > 0) {
            deleteObjects(selectedIds);
            clearSelection();
          }
        },
        enabled: selectedIds.length > 0,
      },

      // Duplicate (Ctrl+D)
      {
        key: 'd',
        modifiers: { ctrl: true },
        action: () => duplicateObjects(selectedIds),
        enabled: selectedIds.length > 0,
      },

      // Rotate (Ctrl+R)
      {
        key: 'r',
        modifiers: { ctrl: true },
        action: () => rotateObjects(selectedIds, 90),
        enabled: selectedIds.length > 0,
      },
    ],
    [
      mode,
      selectedIds,
      setMode,
      zoomIn,
      zoomOut,
      resetView,
      deleteObjects,
      duplicateObjects,
      rotateObjects,
      clearSelection,
    ]
  );

  const onKeyUp = useMemo<KeyboardShortcutOnKeyUp[]>(
    () => [
      {
        key: ' ',
        action: () => mode === 'pan' && setMode('select'),
        enabled: mode === 'pan',
      },
    ],
    [mode, setMode]
  );

  useKeyboardShortcuts({ shortcuts, onKeyUp });

  return (
    <>
      <AppLayout
        leftPanel={<ObjectLibrary />}
        canvas={
          <ErrorBoundary fallback={<CanvasErrorFallback />}>
            <FloorCanvas />
          </ErrorBoundary>
        }
        rightPanel={<PropertiesPanel />}
      />
      <ToastContainer />
    </>
  );
}

export default App;
