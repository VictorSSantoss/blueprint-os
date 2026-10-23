import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Group, Text, Rect } from 'react-konva';
import type Konva from 'konva';
import { useProjectStore, useSelectionStore, useCanvasStore, useTranslation } from '../../../stores';
import type { FloorObject, ObjectType } from '../../../types';
import type { Language } from '../../../i18n';
import { OBJECT_CATALOG, PIXELS_PER_CM, COLORS } from '../../../constants';
import { getLocalizedObjectName } from '../../../utils/objectNames';
import {
  DoorShape,
  WindowShape,
  BedShape,
  SofaShape,
  TableShape,
  ApplianceShape,
  BathroomShape,
  StairsShape,
  StructuralShape,
  RadiatorShape,
  DefaultShape,
} from '../shapes';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ObjectShapeProps {
  object: FloorObject;
  isSelected: boolean;
  isHovered: boolean;
  zoom: number;
  showLabel: boolean;
  language: Language;
  onSelect: (id: string, additive: boolean) => void;
  onHover: (id: string | null) => void;
  onResize: (id: string, newWidth: number, newDepth: number, newX: number, newY: number, height: number) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
}

function getFillColor(type: ObjectType): string {
  const category = OBJECT_CATALOG[type]?.category;
  switch (category) {
    case 'doors':
      return '#fef3c7';
    case 'windows':
      return '#dbeafe';
    case 'living-room':
      return '#d1fae5';
    case 'bedroom':
      return '#ede9fe';
    case 'dining':
      return '#fce7f3';
    case 'kitchen':
      return '#cffafe';
    case 'bathroom':
      return '#e0e7ff';
    case 'heating':
      return '#fee2e2';
    case 'structural':
      return '#f3f4f6';
    default:
      return '#f3f4f6';
  }
}

function renderObjectShape(
  type: ObjectType,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  strokeWidth: number
) {
  // Doors
  if (type.includes('door')) {
    return (
      <DoorShape
        type={type}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Windows
  if (type.includes('window')) {
    return (
      <WindowShape
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Beds
  if (type.includes('bed')) {
    return (
      <BedShape
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Sofas
  if (type.includes('sofa')) {
    return (
      <SofaShape
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Tables (round and rectangular)
  if (type.includes('table')) {
    return (
      <TableShape
        type={type}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Kitchen appliances
  if (type === 'refrigerator' || type === 'cooktop' || type === 'oven' || type === 'dishwasher') {
    return (
      <ApplianceShape
        type={type}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Bathroom fixtures
  if (type === 'toilet' || type === 'bathtub' || type.includes('shower') || type.includes('sink') || type === 'vanity') {
    return (
      <BathroomShape
        type={type}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Stairs
  if (type.includes('stairs')) {
    return (
      <StairsShape
        type={type}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Structural elements (columns, etc.)
  if (type.includes('column') || type === 'void') {
    return (
      <StructuralShape
        type={type}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Radiators
  if (type.includes('radiator')) {
    return (
      <RadiatorShape
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Default shape
  return (
    <DefaultShape
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

const ObjectShape = memo(
  function ObjectShape({
    object,
    isSelected,
    isHovered,
    zoom,
    showLabel,
    language,
    onSelect,
    onHover,
    onResize,
    onMove,
  }: ObjectShapeProps) {
    const { position, dimensions, rotation, type, id } = object;
    const [resizing, setResizing] = useState<ResizeHandle | null>(null);

    const width = dimensions.width * PIXELS_PER_CM;
    const height = dimensions.depth * PIXELS_PER_CM;
    const x = position.x * PIXELS_PER_CM;
    const y = position.y * PIXELS_PER_CM;

    const strokeWidth = isSelected ? 2 / zoom : 1 / zoom;
    const strokeColor = isSelected ? COLORS.selection.stroke : isHovered ? '#6366f1' : '#64748b';
    const fillColor = getFillColor(type);

    // Use custom label if set, otherwise use localized name
    const objectName = object.customLabel || getLocalizedObjectName(type, language);

    const handleSize = 8 / zoom;
    const handleOffset = handleSize / 2;

    // Get cursor for resize handle
    const getHandleCursor = (handle: ResizeHandle): string => {
      const cursors: Record<ResizeHandle, string> = {
        nw: 'nwse-resize',
        n: 'ns-resize',
        ne: 'nesw-resize',
        e: 'ew-resize',
        se: 'nwse-resize',
        s: 'ns-resize',
        sw: 'nesw-resize',
        w: 'ew-resize',
      };
      return cursors[handle];
    };

    // Handle positions relative to object bounds
    const handlePositions: Record<ResizeHandle, { x: number; y: number }> = {
      nw: { x: 0, y: 0 },
      n: { x: width / 2, y: 0 },
      ne: { x: width, y: 0 },
      e: { x: width, y: height / 2 },
      se: { x: width, y: height },
      s: { x: width / 2, y: height },
      sw: { x: 0, y: height },
      w: { x: 0, y: height / 2 },
    };

    const resizeStartRef = useRef<{ x: number; y: number; width: number; depth: number; handle: ResizeHandle; posX: number; posY: number } | null>(null);
    const lastUpdateRef = useRef<number>(0);

    const handleResizeStart = useCallback((handle: ResizeHandle, e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      setResizing(handle);
      resizeStartRef.current = {
        x: e.evt.clientX,
        y: e.evt.clientY,
        width: dimensions.width,
        depth: dimensions.depth,
        handle,
        posX: position.x,
        posY: position.y,
      };
    }, [dimensions.width, dimensions.depth, position.x, position.y]);

    // Use global mouse events for smooth resizing with throttling
    useEffect(() => {
      if (!resizing || !resizeStartRef.current) return;

      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!resizeStartRef.current) return;

        // Throttle updates to 60fps
        const now = Date.now();
        if (now - lastUpdateRef.current < 16) return;
        lastUpdateRef.current = now;

        const { x: startX, y: startY, width: startWidth, depth: startDepth, handle, posX: startPosX, posY: startPosY } = resizeStartRef.current;
        const deltaX = (e.clientX - startX) / zoom / PIXELS_PER_CM;
        const deltaY = (e.clientY - startY) / zoom / PIXELS_PER_CM;

        let newWidth = startWidth;
        let newDepth = startDepth;
        let newPosX = startPosX;
        let newPosY = startPosY;

        switch (handle) {
          case 'e':
            newWidth = Math.max(10, startWidth + deltaX);
            newPosX = startPosX + (newWidth - startWidth) / 2;
            break;
          case 'w':
            newWidth = Math.max(10, startWidth - deltaX);
            newPosX = startPosX - (newWidth - startWidth) / 2;
            break;
          case 's':
            newDepth = Math.max(10, startDepth + deltaY);
            newPosY = startPosY + (newDepth - startDepth) / 2;
            break;
          case 'n':
            newDepth = Math.max(10, startDepth - deltaY);
            newPosY = startPosY - (newDepth - startDepth) / 2;
            break;
          case 'se':
            newWidth = Math.max(10, startWidth + deltaX);
            newDepth = Math.max(10, startDepth + deltaY);
            newPosX = startPosX + (newWidth - startWidth) / 2;
            newPosY = startPosY + (newDepth - startDepth) / 2;
            break;
          case 'sw':
            newWidth = Math.max(10, startWidth - deltaX);
            newDepth = Math.max(10, startDepth + deltaY);
            newPosX = startPosX - (newWidth - startWidth) / 2;
            newPosY = startPosY + (newDepth - startDepth) / 2;
            break;
          case 'ne':
            newWidth = Math.max(10, startWidth + deltaX);
            newDepth = Math.max(10, startDepth - deltaY);
            newPosX = startPosX + (newWidth - startWidth) / 2;
            newPosY = startPosY - (newDepth - startDepth) / 2;
            break;
          case 'nw':
            newWidth = Math.max(10, startWidth - deltaX);
            newDepth = Math.max(10, startDepth - deltaY);
            newPosX = startPosX - (newWidth - startWidth) / 2;
            newPosY = startPosY - (newDepth - startDepth) / 2;
            break;
        }

        onResize(id, Math.round(newWidth), Math.round(newDepth), newPosX, newPosY, dimensions.height);
      };

      const handleGlobalMouseUp = () => {
        setResizing(null);
        resizeStartRef.current = null;
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }, [resizing, zoom, id, onResize, dimensions.height]);

    return (
      <Group
        name={`object-${id}`}
        x={x}
        y={y}
        rotation={rotation}
        offsetX={width / 2}
        offsetY={height / 2}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(object.id, e.evt.shiftKey);
        }}
        onMouseEnter={() => onHover(object.id)}
        onMouseLeave={() => onHover(null)}
        draggable={isSelected && !resizing}
        onDragEnd={(e) => {
          if (e.target !== e.currentTarget) return;
          onMove(id, {
            x: Math.round(e.target.x() / PIXELS_PER_CM),
            y: Math.round(e.target.y() / PIXELS_PER_CM),
          });
        }}
      >
        {/* Base shape */}
        {renderObjectShape(type, width, height, fillColor, strokeColor, strokeWidth)}

        {/* Always show label at center if showLabel is true, or if selected */}
        {(showLabel || isSelected) && (
          <Text
            text={objectName}
            x={width / 2}
            y={height / 2}
            offsetX={(objectName.length * 3) / zoom}
            offsetY={6 / zoom}
            align="center"
            fontSize={11 / zoom}
            fill={isSelected ? '#1f2937' : '#374151'}
            fontStyle="bold"
            shadowColor="#ffffff"
            shadowBlur={3}
            shadowOpacity={0.9}
          />
        )}

        {/* Dimensions - only when selected */}
        {isSelected && (
          <>
            <Text
              text={`${dimensions.width}cm`}
              x={0}
              y={height / 2 + 4 / zoom}
              width={width}
              align="center"
              fontSize={10 / zoom}
              fill="#6b7280"
            />
            <Text
              text={`${dimensions.depth}cm`}
              x={width / 2 + 4 / zoom}
              y={0}
              fontSize={10 / zoom}
              fill="#6b7280"
            />
          </>
        )}

        {/* Resize handles - only when selected */}
        {isSelected && (
          <Group>
            {(Object.entries(handlePositions) as [ResizeHandle, { x: number; y: number }][]).map(([handle, pos]) => (
              <Rect
                key={handle}
                x={pos.x - handleOffset}
                y={pos.y - handleOffset}
                width={handleSize}
                height={handleSize}
                fill="#ffffff"
                stroke={COLORS.selection.stroke}
                strokeWidth={1 / zoom}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) {
                    stage.container().style.cursor = getHandleCursor(handle);
                  }
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) {
                    stage.container().style.cursor = 'default';
                  }
                }}
                onMouseDown={(e) => handleResizeStart(handle, e)}
              />
            ))}
          </Group>
        )}
      </Group>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.object === nextProps.object &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.zoom === nextProps.zoom &&
      prevProps.showLabel === nextProps.showLabel &&
      prevProps.language === nextProps.language
    );
  }
);

export function ObjectLayer() {
  const { objects, updateObject } = useProjectStore();
  const { selectedIds, hoveredId, select, setHoveredId } = useSelectionStore();
  const { viewport, showObjectLabels } = useCanvasStore();
  const { language } = useTranslation();

  const handleResize = useCallback((id: string, newWidth: number, newDepth: number, newX: number, newY: number, height: number) => {
    updateObject(id, {
      dimensions: { width: newWidth, depth: newDepth, height },
      position: { x: newX, y: newY },
    });
  }, [updateObject]);

  const handleMove = useCallback((id: string, position: { x: number; y: number }) => {
    updateObject(id, { position });
  }, [updateObject]);

  return (
    <Group>
      {objects.map((object) => (
        <ObjectShape
          key={object.id}
          object={object}
          isSelected={selectedIds.includes(object.id)}
          isHovered={hoveredId === object.id}
          zoom={viewport.zoom}
          showLabel={showObjectLabels}
          language={language}
          onSelect={select}
          onHover={setHoveredId}
          onResize={handleResize}
          onMove={handleMove}
        />
      ))}
    </Group>
  );
}
