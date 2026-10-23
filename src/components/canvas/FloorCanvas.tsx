import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore, useToolStore, useProjectStore, useSelectionStore, useCanvasRefStore, useSettingsStore } from '../../stores';
import { GridLayer, RoomLayer, ObjectLayer, InteractionLayer } from './layers';
import { PIXELS_PER_CM, COLORS, ROOM_HANDLE_NAME, ROOM_WALL_NAME } from '../../constants';
import { snapPointToGrid } from '../../utils/geometry';
import { snapToNearestCorner, CORNER_SNAP_TOLERANCE_CM } from '../../utils/linking';
import { nextRoomName } from '../../utils/programme';
import { v4 as uuidv4 } from 'uuid';
import type { ObjectType, Point } from '../../types';

export function FloorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Selection box state
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [selectionBoxStart, setSelectionBoxStart] = useState<Point | null>(null);
  const [selectionBoxEnd, setSelectionBoxEnd] = useState<Point | null>(null);
  const justFinishedSelectionBox = useRef(false);

  const { viewport, setZoom, pan, gridSize, isExporting, setSnapHighlightPoint } = useCanvasStore();
  const setStageRef = useCanvasRefStore((state) => state.setStageRef);
  const { objects } = useProjectStore();

  // Store stage ref for export functionality
  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef.current);
    }
    return () => setStageRef(null);
  }, [setStageRef]);
  const {
    mode,
    isDrawing,
    drawingPoints,
    rectangleStart,
    rectangleEnd,
    startDrawing,
    addDrawingPoint,
    finishDrawing,
    setCursor,
    placingObjectType,
    setPlacingObject,
    startRectangle,
    updateRectangle,
    finishRectangle,
    startRuler,
    updateRuler,
    isRulerActive,
    rulerStart,
  } = useToolStore();
  const { addRoom, addObject, rooms } = useProjectStore();
  const { t } = useSettingsStore();
  const { clearSelection, selectMultiple } = useSelectionStore();

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const oldZoom = viewport.zoom;
      const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;

      setZoom(newZoom, pointer.x, pointer.y);
    },
    [viewport.zoom, setZoom]
  );

  // Convert screen position to canvas position
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - viewport.offsetX) / viewport.zoom / PIXELS_PER_CM,
        y: (screenY - viewport.offsetY) / viewport.zoom / PIXELS_PER_CM,
      };
    },
    [viewport]
  );

  // Create room from rectangle
  const createRoomFromRectangle = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      // Minimum size check
      if (maxX - minX < 10 || maxY - minY < 10) return;

      const corners = [
        { id: uuidv4(), position: { x: minX, y: minY } },
        { id: uuidv4(), position: { x: maxX, y: minY } },
        { id: uuidv4(), position: { x: maxX, y: maxY } },
        { id: uuidv4(), position: { x: minX, y: maxY } },
      ];

      const walls = corners.map((corner, index) => ({
        id: uuidv4(),
        startCornerId: corner.id,
        endCornerId: corners[(index + 1) % corners.length].id,
        thickness: 2,
      }));

      addRoom({
        name: nextRoomName(rooms, t('defaultRoomName')),
        corners,
        walls,
        fillColor: '#f3f4f6',
        isComplete: true,
      });
    },
    [addRoom, rooms, t]
  );

  // Handle canvas click
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const canvasPoint = screenToCanvas(pointer.x, pointer.y);
      const snappedPoint = snapPointToGrid(canvasPoint, gridSize);
      // Prefer snapping to an existing corner over the grid when drawing.
      const cornerSnap = (mode === 'draw-room' || mode === 'draw-rectangle')
        ? snapToNearestCorner(rooms, snappedPoint, CORNER_SNAP_TOLERANCE_CM)
        : null;
      const finalPoint = cornerSnap ?? snappedPoint;

      if (mode === 'draw-room') {
        if (!isDrawing) {
          startDrawing(finalPoint);
        } else {
          // Check if clicking near first point to close
          const firstPoint = drawingPoints[0];
          const distToFirst = Math.sqrt(
            (finalPoint.x - firstPoint.x) ** 2 + (finalPoint.y - firstPoint.y) ** 2
          );

          if (drawingPoints.length > 2 && distToFirst < gridSize * 2) {
            // Close the room
            const corners = drawingPoints.map((p) => ({
              id: uuidv4(),
              position: p,
            }));

            const walls = corners.map((corner, index) => ({
              id: uuidv4(),
              startCornerId: corner.id,
              endCornerId: corners[(index + 1) % corners.length].id,
              thickness: 2,
            }));

            addRoom({
              name: nextRoomName(rooms, t('defaultRoomName')),
              corners,
              walls,
              fillColor: '#f3f4f6',
              isComplete: true,
            });

            finishDrawing();
            setSnapHighlightPoint(null);
          } else {
            addDrawingPoint(finalPoint);
          }
        }
      } else if (placingObjectType) {
        // Place object
        addObject(placingObjectType, snappedPoint);
        setPlacingObject(null);
      } else if (mode === 'select') {
        // Clear selection when clicking on empty canvas
        // But skip if we just finished a selection box (to avoid clearing the selection we just made)
        if (e.target === stage && !justFinishedSelectionBox.current) {
          clearSelection();
        }
        justFinishedSelectionBox.current = false;
      }
    },
    [
      mode,
      isDrawing,
      drawingPoints,
      gridSize,
      screenToCanvas,
      startDrawing,
      addDrawingPoint,
      finishDrawing,
      addRoom,
      placingObjectType,
      addObject,
      setPlacingObject,
      clearSelection,
      rooms,
      setSnapHighlightPoint,
      t,
    ]
  );

  // Handle mouse down for rectangle drawing and selection box
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Handle panning
      if (mode === 'pan' || e.evt.button === 1 || (e.evt.button === 0 && e.evt.altKey)) {
        setIsPanning(true);
        setLastPanPoint({ x: e.evt.clientX, y: e.evt.clientY });
        setCursor('grabbing');
        e.evt.preventDefault();
        return;
      }

      // Handle rectangle drawing
      if (mode === 'draw-rectangle' && e.evt.button === 0) {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        const snappedPoint = snapPointToGrid(canvasPoint, gridSize);
        startRectangle(snapToNearestCorner(rooms, snappedPoint, CORNER_SNAP_TOLERANCE_CM) ?? snappedPoint);
      }

      // Handle ruler
      if (mode === 'ruler' && e.evt.button === 0) {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        const snappedPoint = snapPointToGrid(canvasPoint, gridSize);
        startRuler(snappedPoint);
      }

      // Handle selection box - start when clicking on empty canvas in select mode
      // Check if click target is an object by looking for 'object-' name in ancestors
      let isClickOnObject = false;
      let target = e.target as Konva.Node | null;
      while (target && target !== stage) {
        const name = target.name?.() || '';
        if (name.startsWith('object-') || name === ROOM_HANDLE_NAME || name === ROOM_WALL_NAME) {
          isClickOnObject = true;
          break;
        }
        target = target.parent;
      }

      if (mode === 'select' && e.evt.button === 0 && !isClickOnObject) {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        setIsSelectingBox(true);
        setSelectionBoxStart(canvasPoint);
        setSelectionBoxEnd(canvasPoint);
        if (!e.evt.shiftKey) {
          clearSelection();
        }
      }
    },
    [mode, setCursor, screenToCanvas, gridSize, startRectangle, startRuler, clearSelection, rooms]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Update cursor based on mode
      if (mode === 'pan') {
        setCursor('grab');
      } else if (mode === 'draw-room' || mode === 'draw-rectangle' || mode === 'ruler' || placingObjectType) {
        setCursor('crosshair');
      } else {
        setCursor('default');
      }

      // Update rectangle preview
      if (mode === 'draw-rectangle' && isDrawing && rectangleStart) {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        const snappedPoint = snapPointToGrid(canvasPoint, gridSize);
        updateRectangle(snapToNearestCorner(rooms, snappedPoint, CORNER_SNAP_TOLERANCE_CM) ?? snappedPoint);
      }

      // Update snap indicator during drawing
      if (mode === 'draw-room' || mode === 'draw-rectangle') {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        const snappedPoint = snapPointToGrid(canvasPoint, gridSize);
        const snap = snapToNearestCorner(rooms, snappedPoint, CORNER_SNAP_TOLERANCE_CM);
        setSnapHighlightPoint(snap);
      } else if (mode !== 'select') {
        setSnapHighlightPoint(null);
      }

      // Update ruler preview
      if (mode === 'ruler' && isRulerActive && rulerStart) {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        const snappedPoint = snapPointToGrid(canvasPoint, gridSize);
        updateRuler(snappedPoint);
      }

      // Update selection box
      if (isSelectingBox && selectionBoxStart) {
        const canvasPoint = screenToCanvas(pointer.x, pointer.y);
        setSelectionBoxEnd(canvasPoint);
      }
    },
    [mode, setCursor, placingObjectType, isDrawing, rectangleStart, screenToCanvas, gridSize, updateRectangle, isRulerActive, rulerStart, updateRuler, isSelectingBox, selectionBoxStart, rooms, setSnapHighlightPoint]
  );

  // Handle mouse up for rectangle and selection box
  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Finish rectangle drawing
      if (mode === 'draw-rectangle' && isDrawing && rectangleStart && rectangleEnd) {
        createRoomFromRectangle(rectangleStart, rectangleEnd);
        finishRectangle();
      }

      // Finish ruler measurement (ruler stays visible until mode changes)
      if (mode === 'ruler' && isRulerActive) {
        // Keep the measurement visible - don't finish
        // User can start a new measurement by clicking again
      }

      // Finish selection box and select objects within
      if (isSelectingBox && selectionBoxStart && selectionBoxEnd) {
        const minX = Math.min(selectionBoxStart.x, selectionBoxEnd.x);
        const maxX = Math.max(selectionBoxStart.x, selectionBoxEnd.x);
        const minY = Math.min(selectionBoxStart.y, selectionBoxEnd.y);
        const maxY = Math.max(selectionBoxStart.y, selectionBoxEnd.y);

        // Debug: Log selection box and object positions
        console.log('Selection box (cm):', { minX, maxX, minY, maxY });
        console.log('Objects:', objects.map(o => ({
          id: o.id,
          type: o.type,
          pos: o.position,
          dims: o.dimensions,
          bounds: {
            left: o.position.x - o.dimensions.width / 2,
            right: o.position.x + o.dimensions.width / 2,
            top: o.position.y - o.dimensions.depth / 2,
            bottom: o.position.y + o.dimensions.depth / 2
          }
        })));

        // Find objects within selection box
        const selectedObjectIds = objects
          .filter((obj) => {
            const objX = obj.position.x;
            const objY = obj.position.y;
            const halfWidth = obj.dimensions.width / 2;
            const halfDepth = obj.dimensions.depth / 2;

            // Check if object bounds intersect with selection box
            const intersects = (
              objX + halfWidth >= minX &&
              objX - halfWidth <= maxX &&
              objY + halfDepth >= minY &&
              objY - halfDepth <= maxY
            );

            console.log(`Object ${obj.id} (${obj.type}): intersects=${intersects}`);
            return intersects;
          })
          .map((obj) => obj.id);

        console.log('Selected IDs:', selectedObjectIds);

        if (selectedObjectIds.length > 0) {
          selectMultiple(selectedObjectIds);
        }

        // Mark that we just finished selection box to prevent handleClick from clearing selection
        justFinishedSelectionBox.current = true;

        setIsSelectingBox(false);
        setSelectionBoxStart(null);
        setSelectionBoxEnd(null);
      }

      // Finish panning
      if (isPanning) {
        setIsPanning(false);
        setCursor(mode === 'pan' ? 'grab' : 'default');
      }
    },
    [mode, isDrawing, rectangleStart, rectangleEnd, createRoomFromRectangle, finishRectangle, isPanning, setCursor, isRulerActive, isSelectingBox, selectionBoxStart, selectionBoxEnd, objects, selectMultiple]
  );

  // Handle panning
  const handleMouseMoveForPan = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        pan(deltaX, deltaY);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPoint, pan]
  );

  const handleGlobalMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setCursor(mode === 'pan' ? 'grab' : 'default');
    }
  }, [isPanning, mode, setCursor]);

  // Add global mouse move/up listeners for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMoveForPan);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMoveForPan);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isPanning, handleMouseMoveForPan, handleGlobalMouseUp]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc inside a panel field belongs to that field (e.g. restoring its value), not the canvas.
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return;
      // Escape to cancel drawing
      if (e.key === 'Escape') {
        if (isDrawing) {
          finishDrawing();
          finishRectangle();
        }
        if (placingObjectType) {
          setPlacingObject(null);
        }
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, finishDrawing, finishRectangle, placingObjectType, setPlacingObject, clearSelection]);

  const { cursor, isDragging, stopDragging } = useToolStore();

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const objectType = e.dataTransfer.getData('application/floor-maker-object');
      if (!objectType) return;

      // Get the container's bounding rect
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate drop position relative to container
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      // Convert to canvas coordinates
      const canvasPoint = screenToCanvas(dropX, dropY);
      const snappedPoint = snapPointToGrid(canvasPoint, gridSize);

      // Add the object at the drop location
      addObject(objectType as ObjectType, snappedPoint);

      // Stop dragging state
      stopDragging();
    },
    [screenToCanvas, gridSize, addObject, stopDragging]
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-paper overflow-hidden ${isDragging ? 'ring-2 ring-teal ring-inset' : ''}`}
      style={{ cursor }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {!isExporting && (
          <Layer>
            <GridLayer width={dimensions.width} height={dimensions.height} />
          </Layer>
        )}
        <Layer
          x={viewport.offsetX}
          y={viewport.offsetY}
          scaleX={viewport.zoom}
          scaleY={viewport.zoom}
        >
          <RoomLayer />
          <ObjectLayer />
        </Layer>
        {!isExporting && (
          <Layer
            x={viewport.offsetX}
            y={viewport.offsetY}
            scaleX={viewport.zoom}
            scaleY={viewport.zoom}
          >
            <InteractionLayer />
          </Layer>
        )}
        {/* Selection box layer */}
        {isSelectingBox && selectionBoxStart && selectionBoxEnd && (
          <Layer
            x={viewport.offsetX}
            y={viewport.offsetY}
            scaleX={viewport.zoom}
            scaleY={viewport.zoom}
          >
            <Rect
              x={Math.min(selectionBoxStart.x, selectionBoxEnd.x) * PIXELS_PER_CM}
              y={Math.min(selectionBoxStart.y, selectionBoxEnd.y) * PIXELS_PER_CM}
              width={Math.abs(selectionBoxEnd.x - selectionBoxStart.x) * PIXELS_PER_CM}
              height={Math.abs(selectionBoxEnd.y - selectionBoxStart.y) * PIXELS_PER_CM}
              fill={COLORS.selection.fill}
              stroke={COLORS.selection.stroke}
              strokeWidth={1 / viewport.zoom}
              dash={[4 / viewport.zoom, 4 / viewport.zoom]}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
}
