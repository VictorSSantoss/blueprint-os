import { Group, Line, Rect, Circle, Text } from 'react-konva';
import { useToolStore, useCanvasStore } from '../../../stores';
import { PIXELS_PER_CM, COLORS } from '../../../constants';
import { distance } from '../../../utils/geometry';
import { useTranslation } from '../../../stores';

export function InteractionLayer() {
  const { isDrawing, drawingPoints, mode, rectangleStart, rectangleEnd, rulerStart, rulerEnd, isRulerActive } = useToolStore();
  const { viewport } = useCanvasStore();
  const { t } = useTranslation();
  const { zoom } = viewport;

  // Ruler mode
  if (mode === 'ruler' && isRulerActive && rulerStart && rulerEnd) {
    const startX = rulerStart.x * PIXELS_PER_CM;
    const startY = rulerStart.y * PIXELS_PER_CM;
    const endX = rulerEnd.x * PIXELS_PER_CM;
    const endY = rulerEnd.y * PIXELS_PER_CM;

    const lengthCm = distance(rulerStart, rulerEnd);
    const lengthM = lengthCm / 100;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Calculate angle for label placement
    const angle = Math.atan2(endY - startY, endX - startX);
    const labelOffset = 20 / zoom;

    return (
      <Group>
        {/* Ruler line */}
        <Line
          points={[startX, startY, endX, endY]}
          stroke="#ef4444"
          strokeWidth={2 / zoom}
        />

        {/* Start point */}
        <Circle
          x={startX}
          y={startY}
          radius={6 / zoom}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={2 / zoom}
        />

        {/* End point */}
        <Circle
          x={endX}
          y={endY}
          radius={6 / zoom}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={2 / zoom}
        />

        {/* Measurement label - background */}
        <Rect
          x={midX - 50 / zoom}
          y={midY - labelOffset - 12 / zoom}
          width={100 / zoom}
          height={24 / zoom}
          fill="#ef4444"
          cornerRadius={4 / zoom}
        />

        {/* Measurement label - text */}
        <Text
          x={midX - 50 / zoom}
          y={midY - labelOffset - 8 / zoom}
          width={100 / zoom}
          text={lengthCm >= 100 ? `${lengthM.toFixed(2)}m` : `${Math.round(lengthCm)}cm`}
          fontSize={14 / zoom}
          fill="#ffffff"
          fontStyle="bold"
          align="center"
        />

        {/* End caps (perpendicular lines) */}
        <Line
          points={[
            startX + Math.sin(angle) * 8 / zoom,
            startY - Math.cos(angle) * 8 / zoom,
            startX - Math.sin(angle) * 8 / zoom,
            startY + Math.cos(angle) * 8 / zoom,
          ]}
          stroke="#ef4444"
          strokeWidth={2 / zoom}
        />
        <Line
          points={[
            endX + Math.sin(angle) * 8 / zoom,
            endY - Math.cos(angle) * 8 / zoom,
            endX - Math.sin(angle) * 8 / zoom,
            endY + Math.cos(angle) * 8 / zoom,
          ]}
          stroke="#ef4444"
          strokeWidth={2 / zoom}
        />
      </Group>
    );
  }

  // Rectangle drawing mode
  if (mode === 'draw-rectangle' && isDrawing && rectangleStart && rectangleEnd) {
    const startX = rectangleStart.x * PIXELS_PER_CM;
    const startY = rectangleStart.y * PIXELS_PER_CM;
    const endX = rectangleEnd.x * PIXELS_PER_CM;
    const endY = rectangleEnd.y * PIXELS_PER_CM;

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    const widthCm = Math.abs(rectangleEnd.x - rectangleStart.x);
    const heightCm = Math.abs(rectangleEnd.y - rectangleStart.y);

    return (
      <Group>
        {/* Rectangle preview */}
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={COLORS.selection.fill}
          stroke={COLORS.selection.stroke}
          strokeWidth={2 / zoom}
          dash={[8 / zoom, 4 / zoom]}
        />

        {/* Dimension labels */}
        <Text
          x={x + width / 2 - 30}
          y={y - 25 / zoom}
          text={`${Math.round(widthCm)}cm`}
          fontSize={12 / zoom}
          fill={COLORS.selection.stroke}
          align="center"
        />
        <Text
          x={x + width + 10 / zoom}
          y={y + height / 2 - 6}
          text={`${Math.round(heightCm)}cm`}
          fontSize={12 / zoom}
          fill={COLORS.selection.stroke}
        />

        {/* Corner circles */}
        <Circle x={startX} y={startY} radius={6 / zoom} fill="#22c55e" stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} />
        <Circle x={endX} y={endY} radius={6 / zoom} fill="#ffffff" stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} />

        {/* Hint text */}
        <Text
          x={x + width / 2 - 40}
          y={y + height + 10 / zoom}
          text={t('releaseToFinish')}
          fontSize={11 / zoom}
          fill="#6b7280"
        />
      </Group>
    );
  }

  // Freeform room drawing mode
  if (!isDrawing || mode !== 'draw-room' || drawingPoints.length === 0) {
    return null;
  }

  const pixelPoints = drawingPoints.map((p) => ({
    x: p.x * PIXELS_PER_CM,
    y: p.y * PIXELS_PER_CM,
  }));

  return (
    <Group>
      {/* Drawing lines */}
      {pixelPoints.length > 1 &&
        pixelPoints.slice(0, -1).map((point, index) => {
          const nextPoint = pixelPoints[index + 1];
          const lengthCm = distance(drawingPoints[index], drawingPoints[index + 1]);
          const midX = (point.x + nextPoint.x) / 2;
          const midY = (point.y + nextPoint.y) / 2;

          return (
            <Group key={index}>
              <Line
                points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                stroke={COLORS.selection.stroke}
                strokeWidth={2 / zoom}
                dash={[8 / zoom, 4 / zoom]}
              />
              <Text
                x={midX}
                y={midY - 20 / zoom}
                text={`${Math.round(lengthCm)}cm`}
                fontSize={12 / zoom}
                fill={COLORS.selection.stroke}
                align="center"
              />
            </Group>
          );
        })}

      {/* Corner points */}
      {pixelPoints.map((point, index) => (
        <Group key={index}>
          <Circle
            x={point.x}
            y={point.y}
            radius={6 / zoom}
            fill={index === 0 ? '#22c55e' : '#ffffff'}
            stroke={COLORS.selection.stroke}
            strokeWidth={2 / zoom}
          />
          {index === 0 && pixelPoints.length > 2 && (
            <Text
              x={point.x + 10 / zoom}
              y={point.y - 10 / zoom}
              text={t('clickToClose')}
              fontSize={11 / zoom}
              fill="#22c55e"
            />
          )}
        </Group>
      ))}

      {/* Closing preview line (from last point to first) */}
      {pixelPoints.length > 2 && (
        <Line
          points={[
            pixelPoints[pixelPoints.length - 1].x,
            pixelPoints[pixelPoints.length - 1].y,
            pixelPoints[0].x,
            pixelPoints[0].y,
          ]}
          stroke={COLORS.selection.stroke}
          strokeWidth={1 / zoom}
          dash={[4 / zoom, 4 / zoom]}
          opacity={0.5}
        />
      )}
    </Group>
  );
}
