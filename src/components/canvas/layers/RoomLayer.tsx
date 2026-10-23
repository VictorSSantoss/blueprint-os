import { useMemo } from 'react';
import { Group, Line, Shape, Text, Circle } from 'react-konva';
import { useProjectStore, useSelectionStore, useCanvasStore } from '../../../stores';
import { PIXELS_PER_CM, COLORS, ROOM_HANDLE_NAME, ROOM_WALL_NAME } from '../../../constants';
import { distance, polygonArea, midpoint } from '../../../utils/geometry';
import { snapToNearestCorner, CORNER_SNAP_TOLERANCE_CM } from '../../../utils/linking';
import { roomsOutsideSetbacks } from '../../../utils/lot';
import { formatArea, formatLength } from '../../../utils/format';
import type { Room, Point } from '../../../types';

interface RoomShapeProps {
  room: Room;
  allRooms: readonly Room[];
  isSelected: boolean;
  isHovered: boolean;
  isOutsideSetback: boolean;
  zoom: number;
  showDimensions: boolean;
  gridSize: number;
  onSelect: (id: string, additive: boolean) => void;
  onHover: (id: string | null) => void;
  onCornerDragEnd: (roomId: string, cornerId: string, newPos: Point) => void;
  onCornerDragMove: (rawPos: Point, excludeRoomId: string, from: Point) => void;
  onCornerDragCancel: () => void;
  onWallDragEnd: (roomId: string, wallId: string, delta: { dx: number; dy: number }) => void;
}

function RoomShape({ room, allRooms, isSelected, isHovered, isOutsideSetback, zoom, showDimensions, gridSize, onSelect, onHover, onCornerDragEnd, onCornerDragMove, onCornerDragCancel, onWallDragEnd }: RoomShapeProps) {
  const { corners, walls, fillColor, isComplete, name } = room;

  if (corners.length < 2) return null;

  // Convert corners to pixel coordinates
  const points = corners.map((c) => ({
    x: c.position.x * PIXELS_PER_CM,
    y: c.position.y * PIXELS_PER_CM,
  }));

  // Calculate room area
  const areaCm2 = polygonArea(corners.map((c) => c.position));

  // Calculate centroid for area label
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 }
  );

  // Wall stroke width - thin line, slightly thicker when selected
  const wallStrokeWidth = isSelected ? 3 / zoom : 2 / zoom;
  // A setback warning outranks selection: it must stay visible while the user drags the room back inside.
  const wallColor = isOutsideSetback
    ? COLORS.wall.warning
    : isSelected ? COLORS.wall.selected : isHovered ? '#6366f1' : COLORS.wall.fill;

  return (
    <Group>
      {/* Room fill - clickable area */}
      {isComplete && (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            points.slice(1).forEach((p) => context.lineTo(p.x, p.y));
            context.closePath();
            context.fillStrokeShape(shape);
          }}
          fill={fillColor || COLORS.room.fill}
          opacity={isSelected ? 0.4 : isHovered ? 0.35 : 0.3}
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect(room.id, e.evt.shiftKey);
          }}
          onMouseEnter={() => onHover(room.id)}
          onMouseLeave={() => onHover(null)}
        />
      )}

      {/* Walls — each wall is a draggable group (drag only when room is selected) */}
      {walls.map((wall) => {
        const startCorner = corners.find((c) => c.id === wall.startCornerId);
        const endCorner = corners.find((c) => c.id === wall.endCornerId);
        if (!startCorner || !endCorner) return null;

        const start = {
          x: startCorner.position.x * PIXELS_PER_CM,
          y: startCorner.position.y * PIXELS_PER_CM,
        };
        const end = {
          x: endCorner.position.x * PIXELS_PER_CM,
          y: endCorner.position.y * PIXELS_PER_CM,
        };

        const wallLength = distance(startCorner.position, endCorner.position);
        const mid = midpoint(start, end);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = len > 0 ? -dy / len : 0;
        const perpY = len > 0 ?  dx / len : 0;
        const labelOffset = 20 / zoom;

        return (
          <Group
            key={wall.id}
            name={isSelected ? ROOM_WALL_NAME : undefined}
            draggable={isSelected}
            onDragEnd={(e) => {
              const dxPx = e.target.x();
              const dyPx = e.target.y();
              e.target.position({ x: 0, y: 0 });
              const dxCm = Math.round(dxPx / PIXELS_PER_CM / gridSize) * gridSize;
              const dyCm = Math.round(dyPx / PIXELS_PER_CM / gridSize) * gridSize;
              if (dxCm !== 0 || dyCm !== 0) {
                onWallDragEnd(room.id, wall.id, { dx: dxCm, dy: dyCm });
              }
            }}
            onMouseEnter={(e) => {
              if (!isSelected) return;
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          >
            {/* Visible wall line */}
            <Line
              points={[start.x, start.y, end.x, end.y]}
              stroke={wallColor}
              strokeWidth={wallStrokeWidth}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
            {/* Invisible hit area so the whole wall is grabbable */}
            <Line
              points={[start.x, start.y, end.x, end.y]}
              stroke="transparent"
              strokeWidth={1}
              hitStrokeWidth={12 / zoom}
              listening={isSelected}
            />
            {showDimensions && (
              <Text
                x={mid.x + perpX * labelOffset}
                y={mid.y + perpY * labelOffset}
                text={formatLength(wallLength)}
                fontSize={11 / zoom}
                fill={COLORS.dimension.text}
                offsetX={20}
                offsetY={6}
                listening={false}
              />
            )}
          </Group>
        );
      })}

      {/* Corner handles — only when selected; commit on drag end, not drag move */}
      {isSelected && corners.map((corner) => {
        const x = corner.position.x * PIXELS_PER_CM;
        const y = corner.position.y * PIXELS_PER_CM;
        const handleSize = 8 / zoom;

        return (
          <Circle
            key={corner.id}
            name={ROOM_HANDLE_NAME}
            x={x}
            y={y}
            radius={handleSize}
            fill="#ffffff"
            stroke={COLORS.wall.selected}
            strokeWidth={2 / zoom}
            draggable
            onDragMove={(e) => {
              const rawX = e.target.x() / PIXELS_PER_CM;
              const rawY = e.target.y() / PIXELS_PER_CM;
              onCornerDragMove({ x: rawX, y: rawY }, room.id, corner.position);
            }}
            onDragEnd={(e) => {
              const rawX = e.target.x() / PIXELS_PER_CM;
              const rawY = e.target.y() / PIXELS_PER_CM;

              const cornerSnap = snapToNearestCorner(allRooms, { x: rawX, y: rawY }, CORNER_SNAP_TOLERANCE_CM, room.id, corner.position);
              const gridX = Math.round(rawX / gridSize) * gridSize;
              const gridY = Math.round(rawY / gridSize) * gridSize;
              const finalPos = cornerSnap ?? { x: gridX, y: gridY };

              // Reset Konva node — the store update drives the re-render to the correct position.
              e.target.position({ x: corner.position.x * PIXELS_PER_CM, y: corner.position.y * PIXELS_PER_CM });

              onCornerDragCancel();
              onCornerDragEnd(room.id, corner.id, finalPos);
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
        );
      })}

      {/* Room name and Area label */}
      {isComplete && (
        <Group x={centroid.x} y={centroid.y}>
          {name && (
            <Text
              text={name}
              fontSize={12 / zoom}
              fill="#374151"
              fontStyle="bold"
              offsetX={name.length * 3}
              offsetY={showDimensions ? 20 / zoom : 7}
            />
          )}
          {showDimensions && (
            <Text
              text={formatArea(areaCm2)}
              fontSize={14 / zoom}
              fill={COLORS.dimension.text}
              fontStyle="bold"
              offsetX={30}
              offsetY={-5 / zoom}
            />
          )}
        </Group>
      )}
    </Group>
  );
}

export function RoomLayer() {
  const { rooms, lot, moveCorner, moveWall } = useProjectStore();
  const { selectedIds, hoveredId, select, setHoveredId } = useSelectionStore();
  const { viewport, showDimensions, gridSize, setSnapHighlightPoint } = useCanvasStore();

  const outsideIds = useMemo(
    () => new Set(lot ? roomsOutsideSetbacks(rooms, lot).map((r) => r.id) : []),
    [rooms, lot]
  );

  // Selected rooms draw last so their handles and walls stay grabbable where a neighbour overlaps them.
  const drawOrder = [...rooms].sort(
    (a, b) => Number(selectedIds.includes(a.id)) - Number(selectedIds.includes(b.id))
  );

  return (
    <Group>
      {drawOrder.map((room) => (
        <RoomShape
          key={room.id}
          room={room}
          allRooms={rooms}
          isSelected={selectedIds.includes(room.id)}
          isHovered={hoveredId === room.id}
          isOutsideSetback={outsideIds.has(room.id)}
          zoom={viewport.zoom}
          showDimensions={showDimensions}
          gridSize={gridSize}
          onSelect={select}
          onHover={setHoveredId}
          onCornerDragEnd={moveCorner}
          onCornerDragMove={(rawPos, excludeRoomId, from) => {
            const snap = snapToNearestCorner(rooms, rawPos, CORNER_SNAP_TOLERANCE_CM, excludeRoomId, from);
            setSnapHighlightPoint(snap);
          }}
          onCornerDragCancel={() => setSnapHighlightPoint(null)}
          onWallDragEnd={moveWall}
        />
      ))}
    </Group>
  );
}
