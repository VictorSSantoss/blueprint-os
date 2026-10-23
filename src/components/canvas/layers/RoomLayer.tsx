import { Group, Line, Shape, Text, Circle } from 'react-konva';
import { useProjectStore, useSelectionStore, useCanvasStore } from '../../../stores';
import { PIXELS_PER_CM, COLORS } from '../../../constants';
import { distance, polygonArea, midpoint } from '../../../utils/geometry';
import type { Room, Point } from '../../../types';

interface RoomShapeProps {
  room: Room;
  isSelected: boolean;
  isHovered: boolean;
  zoom: number;
  showDimensions: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onHover: (id: string | null) => void;
  onCornerDrag: (roomId: string, cornerId: string, newPos: Point) => void;
}

function RoomShape({ room, isSelected, isHovered, zoom, showDimensions, onSelect, onHover, onCornerDrag }: RoomShapeProps) {
  const { corners, walls, fillColor, isComplete, name } = room;

  if (corners.length < 2) return null;

  // Convert corners to pixel coordinates
  const points = corners.map((c) => ({
    x: c.position.x * PIXELS_PER_CM,
    y: c.position.y * PIXELS_PER_CM,
  }));

  // Calculate room area
  const areaCm2 = polygonArea(corners.map((c) => c.position));
  const areaM2 = areaCm2 / 10000;

  // Calculate centroid for area label
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 }
  );

  // Wall stroke width - thin line, slightly thicker when selected
  const wallStrokeWidth = isSelected ? 3 / zoom : 2 / zoom;
  const wallColor = isSelected ? COLORS.wall.selected : isHovered ? '#6366f1' : COLORS.wall.fill;

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

      {/* Walls */}
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

        // Calculate perpendicular offset for dimension label
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len;
        const perpY = dx / len;
        const labelOffset = 20 / zoom;

        return (
          <Group key={wall.id}>
            <Line
              points={[start.x, start.y, end.x, end.y]}
              stroke={wallColor}
              strokeWidth={wallStrokeWidth}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={10 / zoom}
            />
            {showDimensions && (
              <Text
                x={mid.x + perpX * labelOffset}
                y={mid.y + perpY * labelOffset}
                text={wallLength >= 100 ? `${(wallLength / 100).toFixed(2)}m` : `${Math.round(wallLength)}cm`}
                fontSize={11 / zoom}
                fill={COLORS.dimension.text}
                offsetX={20}
                offsetY={6}
              />
            )}
          </Group>
        );
      })}

      {/* Corner handles - only show when selected */}
      {isSelected && corners.map((corner) => {
        const x = corner.position.x * PIXELS_PER_CM;
        const y = corner.position.y * PIXELS_PER_CM;
        const handleSize = 8 / zoom;

        return (
          <Circle
            key={corner.id}
            x={x}
            y={y}
            radius={handleSize}
            fill="#ffffff"
            stroke={COLORS.wall.selected}
            strokeWidth={2 / zoom}
            draggable
            onDragMove={(e) => {
              const newX = e.target.x() / PIXELS_PER_CM;
              const newY = e.target.y() / PIXELS_PER_CM;
              onCornerDrag(room.id, corner.id, { x: newX, y: newY });
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
              text={`${areaM2.toFixed(2)} m²`}
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
  const { rooms, updateRoom } = useProjectStore();
  const { selectedIds, hoveredId, select, setHoveredId } = useSelectionStore();
  const { viewport, showDimensions, gridSize } = useCanvasStore();

  const handleCornerDrag = (roomId: string, cornerId: string, newPos: Point) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Snap to grid
    const snappedX = Math.round(newPos.x / gridSize) * gridSize;
    const snappedY = Math.round(newPos.y / gridSize) * gridSize;

    const updatedCorners = room.corners.map((c) =>
      c.id === cornerId ? { ...c, position: { x: snappedX, y: snappedY } } : c
    );

    updateRoom(roomId, { corners: updatedCorners });
  };

  return (
    <Group>
      {rooms.map((room) => (
        <RoomShape
          key={room.id}
          room={room}
          isSelected={selectedIds.includes(room.id)}
          isHovered={hoveredId === room.id}
          zoom={viewport.zoom}
          showDimensions={showDimensions}
          onSelect={select}
          onHover={setHoveredId}
          onCornerDrag={handleCornerDrag}
        />
      ))}
    </Group>
  );
}
