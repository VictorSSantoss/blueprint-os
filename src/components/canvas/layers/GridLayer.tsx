import { useMemo } from 'react';
import { Shape } from 'react-konva';
import { useCanvasStore } from '../../../stores';
import { PIXELS_PER_CM, COLORS } from '../../../constants';

interface GridLayerProps {
  width: number;
  height: number;
}

export function GridLayer({ width, height }: GridLayerProps) {
  const { viewport, gridSize, showGrid } = useCanvasStore();

  const gridConfig = useMemo(() => {
    if (!showGrid) return null;

    const { zoom, offsetX, offsetY } = viewport;
    const pixelGridSize = gridSize * PIXELS_PER_CM * zoom;

    // Don't render grid if it's too small
    if (pixelGridSize < 5) return null;

    // Calculate visible area in canvas coordinates
    const startX = Math.floor(-offsetX / zoom / (gridSize * PIXELS_PER_CM)) * gridSize * PIXELS_PER_CM;
    const startY = Math.floor(-offsetY / zoom / (gridSize * PIXELS_PER_CM)) * gridSize * PIXELS_PER_CM;
    const endX = Math.ceil((width - offsetX) / zoom / (gridSize * PIXELS_PER_CM)) * gridSize * PIXELS_PER_CM;
    const endY = Math.ceil((height - offsetY) / zoom / (gridSize * PIXELS_PER_CM)) * gridSize * PIXELS_PER_CM;

    return { startX, startY, endX, endY, pixelGridSize };
  }, [viewport, gridSize, showGrid, width, height]);

  if (!gridConfig) return null;

  const { startX, startY, endX, endY } = gridConfig;
  const { zoom, offsetX, offsetY } = viewport;

  // Fade grid at low zoom
  const opacity = Math.min(1, (zoom - 0.2) / 0.3);
  if (opacity <= 0) return null;

  return (
    <Shape
      sceneFunc={(context, shape) => {
        context.beginPath();
        context.strokeStyle = COLORS.grid.line;
        context.lineWidth = 0.5;
        context.globalAlpha = opacity;

        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize * PIXELS_PER_CM) {
          const screenX = x * zoom + offsetX;
          context.moveTo(screenX, 0);
          context.lineTo(screenX, height);
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize * PIXELS_PER_CM) {
          const screenY = y * zoom + offsetY;
          context.moveTo(0, screenY);
          context.lineTo(width, screenY);
        }

        context.stroke();

        // Draw major grid lines (every 100cm = 1m)
        const majorGridSize = 100 * PIXELS_PER_CM;
        const majorStartX = Math.floor(-offsetX / zoom / majorGridSize) * majorGridSize;
        const majorStartY = Math.floor(-offsetY / zoom / majorGridSize) * majorGridSize;
        const majorEndX = Math.ceil((width - offsetX) / zoom / majorGridSize) * majorGridSize;
        const majorEndY = Math.ceil((height - offsetY) / zoom / majorGridSize) * majorGridSize;

        context.beginPath();
        context.strokeStyle = COLORS.grid.lineDark;
        context.lineWidth = 1;
        context.globalAlpha = opacity * 0.5;

        // Major vertical lines
        for (let x = majorStartX; x <= majorEndX; x += majorGridSize) {
          const screenX = x * zoom + offsetX;
          context.moveTo(screenX, 0);
          context.lineTo(screenX, height);
        }

        // Major horizontal lines
        for (let y = majorStartY; y <= majorEndY; y += majorGridSize) {
          const screenY = y * zoom + offsetY;
          context.moveTo(0, screenY);
          context.lineTo(width, screenY);
        }

        context.stroke();
        context.globalAlpha = 1;

        // Draw origin crosshair
        const originX = offsetX;
        const originY = offsetY;

        context.beginPath();
        context.strokeStyle = '#ef4444';
        context.lineWidth = 2;
        context.globalAlpha = 0.5;

        // Horizontal line through origin
        context.moveTo(originX - 20, originY);
        context.lineTo(originX + 20, originY);

        // Vertical line through origin
        context.moveTo(originX, originY - 20);
        context.lineTo(originX, originY + 20);

        context.stroke();
        context.globalAlpha = 1;

        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
}
