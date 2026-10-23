import { useCanvasStore, useProjectStore, useSelectionStore, useSettingsStore } from '../../stores';
import { polygonArea } from '../../utils/geometry';
import { formatArea } from '../../utils/format';
import type { GridSize } from '../../types';

export function StatusBar() {
  const { viewport, gridSize, setGridSize } = useCanvasStore();
  const { rooms, objects } = useProjectStore();
  const { selectedIds } = useSelectionStore();
  const { t } = useSettingsStore();

  const totalAreaCm2 = rooms.reduce((sum, room) => {
    if (!room.isComplete) return sum;
    return sum + polygonArea(room.corners.map((c) => c.position));
  }, 0);

  return (
    <div className="h-7 bg-panel border-t border-line flex items-center px-4 text-xs text-ink-secondary gap-6">
      {/* Zoom */}
      <div className="flex items-center gap-2">
        <span className="text-ink-faint">{t('zoom')}:</span>
        <span className="font-medium">{Math.round(viewport.zoom * 100)}%</span>
      </div>

      {/* Grid size */}
      <div className="flex items-center gap-2">
        <span className="text-ink-faint">{t('grid')}:</span>
        <select
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value) as GridSize)}
          className="bg-transparent font-medium focus:outline-none cursor-pointer"
        >
          <option value={1}>1cm</option>
          <option value={5}>5cm</option>
          <option value={10}>10cm</option>
        </select>
      </div>

      {/* Room area */}
      <div className="flex items-center gap-2">
        <span className="text-ink-faint">{t('totalArea')}:</span>
        <span className="font-medium">{formatArea(totalAreaCm2)}</span>
      </div>

      {/* Object count */}
      <div className="flex items-center gap-2">
        <span className="text-ink-faint">{t('objects')}:</span>
        <span className="font-medium">{objects.length}</span>
      </div>

      {/* Selection */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-ink-faint">{t('selected')}:</span>
          <span className="font-medium text-teal">{selectedIds.length}</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Coordinates */}
      <div className="text-ink-faint">
        {t('pressToDrawRoom')}
      </div>
    </div>
  );
}
