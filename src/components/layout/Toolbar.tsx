import {
  MousePointerIcon,
  PentagonIcon,
  SquareIcon,
  RulerIcon,
  HandIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
} from 'lucide-react';
import { useToolStore, useCanvasStore, useSettingsStore } from '../../stores';
import type { ToolMode } from '../../types';

interface ToolButtonProps {
  mode: ToolMode;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ mode, icon, label, shortcut }: ToolButtonProps) {
  const { mode: currentMode, setMode } = useToolStore();
  const isActive = currentMode === mode;

  return (
    <button
      onClick={() => setMode(mode)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
        isActive
          ? 'bg-teal text-ink-inverse'
          : 'bg-hover hover:bg-line text-ink'
      }`}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

export function Toolbar() {
  const { viewport, zoomIn, zoomOut, resetView } = useCanvasStore();
  const { t } = useSettingsStore();

  return (
    <div className="h-10 bg-panel border-b border-line flex items-center px-4 gap-2">
      {/* Tool selection */}
      <div className="flex items-center gap-1">
        <ToolButton
          mode="select"
          icon={<MousePointerIcon className="w-4 h-4" />}
          label={t('select')}
          shortcut="V"
        />
        <ToolButton
          mode="draw-room"
          icon={<PentagonIcon className="w-4 h-4" />}
          label={t('drawPolygon')}
          shortcut="R"
        />
        <ToolButton
          mode="draw-rectangle"
          icon={<SquareIcon className="w-4 h-4" />}
          label={t('drawRectangle')}
        />
        <ToolButton
          mode="ruler"
          icon={<RulerIcon className="w-4 h-4" />}
          label={t('ruler')}
        />
        <ToolButton
          mode="pan"
          icon={<HandIcon className="w-4 h-4" />}
          label={t('pan')}
          shortcut="Space"
        />
      </div>

      <div className="flex-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="p-1.5 rounded hover:bg-hover"
          title={`${t('zoomOut')} (-)`}
        >
          <ZoomOutIcon className="w-4 h-4" />
        </button>
        <div className="text-sm font-medium text-ink-secondary w-16 text-center">
          {Math.round(viewport.zoom * 100)}%
        </div>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded hover:bg-hover"
          title={`${t('zoomIn')} (+)`}
        >
          <ZoomInIcon className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 rounded hover:bg-hover"
          title={`${t('resetView')} (0)`}
        >
          <MaximizeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
