import { useMemo, useState } from 'react';
import { useSelectionStore, useProjectStore, useCanvasStore, useSettingsStore } from '../../../stores';
import { OBJECT_CATALOG } from '../../../constants';
import { polygonArea, polygonPerimeter } from '../../../utils/geometry';
import { formatArea, formatLength, formatAreaForInput } from '../../../utils/format';
import { parseAreaInput, compareToTarget } from '../../../utils/programme';
import { Trash2Icon, RotateCwIcon, CopyIcon } from 'lucide-react';
import type { FloorObject, Room } from '../../../types';
import { getLocalizedObjectName } from '../../../utils/objectNames';

function TargetAreaField({ room, areaCm2 }: { room: Room; areaCm2: number }) {
  const { updateRoom } = useProjectStore();
  const { t } = useSettingsStore();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const shown = draft ?? (room.targetAreaCm2 ? formatAreaForInput(room.targetAreaCm2) : '');

  const commit = () => {
    if (draft === null) return;
    if (draft.trim() === '') {
      updateRoom(room.id, { targetAreaCm2: undefined });
    } else {
      const cm2 = parseAreaInput(draft);
      if (cm2 === null) {
        setInvalid(true);
        return;
      }
      updateRoom(room.id, { targetAreaCm2: cm2 });
    }
    setDraft(null);
    setInvalid(false);
  };

  const cancel = () => {
    setDraft(null);
    setInvalid(false);
  };

  const comparison = room.targetAreaCm2 && room.isComplete
    ? compareToTarget(areaCm2, room.targetAreaCm2)
    : null;

  return (
    <div>
      <label htmlFor={`target-${room.id}`} className="block text-xs font-medium text-ink-secondary uppercase mb-2">
        {t('targetArea')}
      </label>
      <input
        id={`target-${room.id}`}
        type="text"
        inputMode="decimal"
        value={shown}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        }}
        aria-invalid={invalid}
        title={invalid ? t('invalidArea') : undefined}
        placeholder="14,5"
        className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 ${
          invalid ? 'border-ember focus:ring-ember' : 'border-line focus:ring-teal'
        }`}
      />
      {invalid && <p className="mt-1 text-xs text-ember">{t('invalidArea')}</p>}
      {comparison && room.targetAreaCm2 && (
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-secondary">{t('targetShort')}</span>
            <span className="font-medium">{formatArea(room.targetAreaCm2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary">{t('actualArea')}</span>
            <span className="font-medium">{formatArea(areaCm2)}</span>
          </div>
          <p
            className={`px-2 py-1 rounded text-right font-medium ${
              comparison.withinTolerance ? 'bg-teal-wash text-teal-deep' : 'bg-amber-wash text-amber'
            }`}
          >
            {comparison.diffCm2 < 0 ? t('areaShort') : t('areaOver')} {formatArea(Math.abs(comparison.diffCm2))}
          </p>
        </div>
      )}
    </div>
  );
}

function RoomProperties({ room }: { room: Room }) {
  const { updateRoom, deleteRoom } = useProjectStore();
  const { clearSelection } = useSelectionStore();
  const { t } = useSettingsStore();

  const areaCm2 = room.isComplete ? polygonArea(room.corners.map((c) => c.position)) : 0;
  const perimeterCm = room.isComplete ? polygonPerimeter(room.corners.map((c) => c.position)) : 0;

  const handleNameChange = (value: string) => {
    updateRoom(room.id, { name: value || undefined });
  };

  const handleDelete = () => {
    deleteRoom(room.id);
    clearSelection();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Room header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink">{room.name || t('room')}</h3>
          <p className="text-xs text-ink-secondary">{room.corners.length} {t('corners') || 'corners'}</p>
        </div>
        <button
          onClick={handleDelete}
          className="p-1.5 hover:bg-ember-wash rounded text-ember"
          title={t('deleteRoom')}
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>

      {/* Room Name */}
      <div>
        <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('roomName')}</h4>
        <input
          type="text"
          value={room.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t('enterRoomName')}
          className="w-full px-2 py-1.5 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      {/* Room Statistics */}
      {room.isComplete && (
        <div>
          <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('dimensions')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-secondary">{t('totalArea')}</span>
              <span className="font-medium">{formatArea(areaCm2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">{t('totalPerimeter')}</span>
              <span className="font-medium">{formatLength(perimeterCm)}</span>
            </div>
          </div>
        </div>
      )}

      <TargetAreaField key={room.id} room={room} areaCm2={areaCm2} />

      {/* Room Color */}
      <div>
        <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('fillColor') || 'Fill Color'}</h4>
        <input
          type="color"
          value={room.fillColor || '#e5e7eb'}
          onChange={(e) => updateRoom(room.id, { fillColor: e.target.value })}
          className="w-full h-8 rounded border border-line cursor-pointer"
        />
      </div>

      {/* Instructions */}
      <div className="p-3 bg-teal-wash rounded-lg text-sm text-teal-deep">
        <p>{t('dragCornersToResize') || 'Drag corner handles to resize the room.'}</p>
      </div>
    </div>
  );
}

function ObjectProperties({ object }: { object: FloorObject }) {
  const { updateObject, deleteObjects, duplicateObjects } = useProjectStore();
  const { clearSelection, select } = useSelectionStore();
  const { language, t } = useSettingsStore();
  const definition = OBJECT_CATALOG[object.type];
  const localizedName = getLocalizedObjectName(object.type, language);

  const handleDimensionChange = (key: 'width' | 'depth' | 'height', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;
    updateObject(object.id, {
      dimensions: { ...object.dimensions, [key]: numValue },
    });
  };

  const handlePositionChange = (key: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    updateObject(object.id, {
      position: { ...object.position, [key]: numValue },
    });
  };

  const handleRotationChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    updateObject(object.id, { rotation: numValue % 360 });
  };

  const handleDelete = () => {
    deleteObjects([object.id]);
    clearSelection();
  };

  const handleDuplicate = () => {
    const newIds = duplicateObjects([object.id]);
    if (newIds.length > 0) {
      clearSelection();
      select(newIds[0]);
    }
  };

  const handleRotate90 = () => {
    updateObject(object.id, { rotation: (object.rotation + 90) % 360 });
  };

  const handleCustomNameChange = (value: string) => {
    updateObject(object.id, { customLabel: value || undefined });
  };

  // Display name: custom label if set, otherwise localized name
  const displayName = object.customLabel || localizedName;

  return (
    <div className="p-4 space-y-4">
      {/* Object type header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink">{displayName}</h3>
          <p className="text-xs text-ink-secondary">{definition?.category || t('object')}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleRotate90}
            className="p-1.5 hover:bg-hover rounded"
            title={t('rotate90')}
          >
            <RotateCwIcon className="w-4 h-4 text-ink-secondary" />
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1.5 hover:bg-hover rounded"
            title={t('duplicate')}
          >
            <CopyIcon className="w-4 h-4 text-ink-secondary" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-ember-wash rounded text-ember"
            title={t('delete')}
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Name */}
      <div>
        <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('customName')}</h4>
        <input
          type="text"
          value={object.customLabel || ''}
          onChange={(e) => handleCustomNameChange(e.target.value)}
          placeholder={t('enterCustomName')}
          className="w-full px-2 py-1.5 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
        />
        <p className="text-xs text-ink-faint mt-1">{localizedName}</p>
      </div>

      {/* Dimensions */}
      <div>
        <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('dimensions')}</h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-ink-secondary">{t('width')}</label>
            <div className="flex items-center">
              <input
                type="number"
                value={object.dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <span className="ml-1 text-xs text-ink-faint">cm</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-secondary">{t('depth')}</label>
            <div className="flex items-center">
              <input
                type="number"
                value={object.dimensions.depth}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <span className="ml-1 text-xs text-ink-faint">cm</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-secondary">{t('height')}</label>
            <div className="flex items-center">
              <input
                type="number"
                value={object.dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <span className="ml-1 text-xs text-ink-faint">cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Size variants */}
      {definition?.variants && definition.variants.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('presets')}</h4>
          <div className="flex flex-wrap gap-1">
            {definition.variants.map((variant) => (
              <button
                key={variant.label}
                onClick={() => updateObject(object.id, { dimensions: variant.dimensions })}
                className="px-2 py-1 text-xs bg-hover hover:bg-line rounded"
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Position */}
      <div>
        <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('position')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-secondary">X</label>
            <div className="flex items-center">
              <input
                type="number"
                value={Math.round(object.position.x)}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <span className="ml-1 text-xs text-ink-faint">cm</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-secondary">Y</label>
            <div className="flex items-center">
              <input
                type="number"
                value={Math.round(object.position.y)}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <span className="ml-1 text-xs text-ink-faint">cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('rotation')}</h4>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="360"
            value={object.rotation}
            onChange={(e) => handleRotationChange(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center w-16">
            <input
              type="number"
              value={Math.round(object.rotation)}
              onChange={(e) => handleRotationChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
            />
            <span className="ml-1 text-xs text-ink-faint">°</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgrammeTable() {
  const { rooms } = useProjectStore();
  const { t } = useSettingsStore();

  const { rows, targetTotalCm2, actualTotalCm2, withTarget } = useMemo(() => {
    const rows = rooms
      .filter((r) => r.isComplete)
      .map((r) => {
        const actualCm2 = polygonArea(r.corners.map((c) => c.position));
        return {
          id: r.id,
          name: r.name || t('room'),
          actualCm2,
          targetCm2: r.targetAreaCm2,
          withinTolerance: r.targetAreaCm2 ? compareToTarget(actualCm2, r.targetAreaCm2).withinTolerance : null,
        };
      });
    const withTarget = rows.filter((r) => r.targetCm2);
    return {
      rows,
      withTarget: withTarget.length,
      targetTotalCm2: withTarget.reduce((sum, r) => sum + (r.targetCm2 ?? 0), 0),
      actualTotalCm2: rows.reduce((sum, r) => sum + r.actualCm2, 0),
    };
  }, [rooms, t]);

  return (
    <div>
      <h4 className="text-xs font-medium text-ink-secondary uppercase mb-2">{t('roomProgramme')}</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-ink-faint">
            <th className="text-left font-normal pb-1">{t('room')}</th>
            <th className="text-right font-normal pb-1">{t('targetShort')}</th>
            <th className="text-right font-normal pb-1">{t('actualShort')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line-faint">
              <td className="py-1 pr-2 truncate max-w-[8rem]" title={r.name}>{r.name}</td>
              <td className="py-1 text-right text-ink-secondary">{r.targetCm2 ? formatArea(r.targetCm2) : '—'}</td>
              <td
                className={`py-1 text-right font-medium ${
                  r.withinTolerance === null ? '' : r.withinTolerance ? 'text-teal-deep' : 'text-amber'
                }`}
              >
                {formatArea(r.actualCm2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line font-semibold">
            <td className="pt-1">{t('total')}</td>
            <td className="pt-1 text-right">{withTarget > 0 ? formatArea(targetTotalCm2) : '—'}</td>
            <td className="pt-1 text-right">{formatArea(actualTotalCm2)}</td>
          </tr>
        </tfoot>
      </table>
      {withTarget > 0 && withTarget < rows.length && (
        <p className="mt-1 text-xs text-ink-secondary">
          {t('roomsWithTarget').replace('{count}', String(withTarget)).replace('{total}', String(rows.length))}
        </p>
      )}
      <p className="mt-2 text-xs text-ink-faint">{t('areaMeasurementNote')}</p>
    </div>
  );
}

function RoomStatistics() {
  const { rooms, objects } = useProjectStore();
  const { t } = useSettingsStore();

  const { totalAreaCm2, totalPerimeterCm, completedRoomCount } = useMemo(() => {
    let area = 0;
    let perimeter = 0;
    let completed = 0;

    for (const room of rooms) {
      if (!room.isComplete) continue;
      completed++;
      const corners = room.corners.map((c) => c.position);
      area += polygonArea(corners);
      perimeter += polygonPerimeter(corners);
    }

    return { totalAreaCm2: area, totalPerimeterCm: perimeter, completedRoomCount: completed };
  }, [rooms]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-ink">{t('roomStatistics')}</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-secondary">{t('rooms')}</span>
          <span className="font-medium">{completedRoomCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-secondary">{t('totalArea')}</span>
          <span className="font-medium">{formatArea(totalAreaCm2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-secondary">{t('totalPerimeter')}</span>
          <span className="font-medium">{formatLength(totalPerimeterCm)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-secondary">{t('objectsPlaced')}</span>
          <span className="font-medium">{objects.length}</span>
        </div>
      </div>

      {completedRoomCount > 0 && <ProgrammeTable />}

      {rooms.length === 0 && (
        <div className="mt-4 p-3 bg-hover rounded-lg text-sm text-ink-secondary">
          <p>{t('noRoomsYet')}</p>
          <p className="mt-1">{t('noRoomsHint')}</p>
        </div>
      )}
    </div>
  );
}

function ProjectSettings() {
  const { gridSize, setGridSize, showGrid, showDimensions, toggleGrid, toggleDimensions } = useCanvasStore();
  const { t } = useSettingsStore();

  return (
    <div className="p-4 space-y-4 border-t border-line">
      <h3 className="font-semibold text-ink">{t('settings')}</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-secondary">{t('gridSize')}</span>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value) as 1 | 5 | 10)}
            className="px-2 py-1 text-sm border border-line rounded focus:outline-none focus:ring-1 focus:ring-teal"
          >
            <option value={1}>1 cm</option>
            <option value={5}>5 cm</option>
            <option value={10}>10 cm</option>
          </select>
        </div>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-ink-secondary">{t('showGrid')}</span>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={toggleGrid}
            className="rounded border-line text-teal focus:ring-teal"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-ink-secondary">{t('showDimensions')}</span>
          <input
            type="checkbox"
            checked={showDimensions}
            onChange={toggleDimensions}
            className="rounded border-line text-teal focus:ring-teal"
          />
        </label>
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const { selectedIds } = useSelectionStore();
  const { objects, rooms } = useProjectStore();

  const selectedObject = selectedIds.length === 1
    ? objects.find((obj) => obj.id === selectedIds[0])
    : null;

  const selectedRoom = selectedIds.length === 1
    ? rooms.find((room) => room.id === selectedIds[0])
    : null;

  return (
    <div className="h-full flex flex-col">
      {selectedObject ? (
        <ObjectProperties object={selectedObject} />
      ) : selectedRoom ? (
        <RoomProperties room={selectedRoom} />
      ) : (
        <RoomStatistics />
      )}
      <div className="flex-1" />
      <ProjectSettings />
    </div>
  );
}
