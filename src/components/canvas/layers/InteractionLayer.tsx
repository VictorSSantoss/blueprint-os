import { Group, Line, Rect, Circle, Text } from 'react-konva';
import { useToolStore, useCanvasStore } from '../../../stores';
import { PIXELS_PER_CM, COLORS } from '../../../constants';
import { distance } from '../../../utils/geometry';
import { formatLength } from '../../../utils/format';
import { useTranslation } from '../../../stores';

const SNAP_INDICATOR_COLOR = '#22c55e';

export function InteractionLayer() {
  const { isDrawing, drawingPoints, mode, rectangleStart, rectangleEnd, rulerStart, rulerEnd, isRulerActive } = useToolStore();
  const { viewport, snapHighlightPoint } = useCanvasStore();
  const { t } = useTranslation();
  const { zoom } = viewport;

  const showRuler = mode === 'ruler' && isRulerActive && rulerStart && rulerEnd;
  const showRectangle = mode === 'draw-rectangle' && isDrawing && rectangleStart && rectangleEnd;
  const showPolygon = isDrawing && mode === 'draw-room' && drawingPoints.length > 0;

  // Ruler geometry
  const rulerStartX = rulerStart ? rulerStart.x * PIXELS_PER_CM : 0;
  const rulerStartY = rulerStart ? rulerStart.y * PIXELS_PER_CM : 0;
  const rulerEndX   = rulerEnd   ? rulerEnd.x   * PIXELS_PER_CM : 0;
  const rulerEndY   = rulerEnd   ? rulerEnd.y   * PIXELS_PER_CM : 0;
  const rulerLengthCm = rulerStart && rulerEnd ? distance(rulerStart, rulerEnd) : 0;
  const rulerAngle = Math.atan2(rulerEndY - rulerStartY, rulerEndX - rulerStartX);
  const rulerMidX = (rulerStartX + rulerEndX) / 2;
  const rulerMidY = (rulerStartY + rulerEndY) / 2;
  const rulerLabelOffset = 20 / zoom;

  // Rectangle geometry
  const rectStartX = rectangleStart ? rectangleStart.x * PIXELS_PER_CM : 0;
  const rectStartY = rectangleStart ? rectangleStart.y * PIXELS_PER_CM : 0;
  const rectEndX   = rectangleEnd   ? rectangleEnd.x   * PIXELS_PER_CM : 0;
  const rectEndY   = rectangleEnd   ? rectangleEnd.y   * PIXELS_PER_CM : 0;
  const rectX = Math.min(rectStartX, rectEndX);
  const rectY = Math.min(rectStartY, rectEndY);
  const rectW = Math.abs(rectEndX - rectStartX);
  const rectH = Math.abs(rectEndY - rectStartY);
  const rectWcm = rectangleStart && rectangleEnd ? Math.abs(rectangleEnd.x - rectangleStart.x) : 0;
  const rectHcm = rectangleStart && rectangleEnd ? Math.abs(rectangleEnd.y - rectangleStart.y) : 0;

  // Polygon geometry
  const pixelPoints = drawingPoints.map((p) => ({
    x: p.x * PIXELS_PER_CM,
    y: p.y * PIXELS_PER_CM,
  }));

  return (
    <Group>
      {/* Ruler */}
      {showRuler && (
        <Group>
          <Line points={[rulerStartX, rulerStartY, rulerEndX, rulerEndY]} stroke="#ef4444" strokeWidth={2 / zoom} />
          <Circle x={rulerStartX} y={rulerStartY} radius={6 / zoom} fill="#ef4444" stroke="#ffffff" strokeWidth={2 / zoom} />
          <Circle x={rulerEndX}   y={rulerEndY}   radius={6 / zoom} fill="#ef4444" stroke="#ffffff" strokeWidth={2 / zoom} />
          <Rect
            x={rulerMidX - 50 / zoom}
            y={rulerMidY - rulerLabelOffset - 12 / zoom}
            width={100 / zoom}
            height={24 / zoom}
            fill="#ef4444"
            cornerRadius={4 / zoom}
          />
          <Text
            x={rulerMidX - 50 / zoom}
            y={rulerMidY - rulerLabelOffset - 8 / zoom}
            width={100 / zoom}
            text={formatLength(rulerLengthCm)}
            fontSize={14 / zoom}
            fill="#ffffff"
            fontStyle="bold"
            align="center"
          />
          <Line
            points={[
              rulerStartX + Math.sin(rulerAngle) * 8 / zoom, rulerStartY - Math.cos(rulerAngle) * 8 / zoom,
              rulerStartX - Math.sin(rulerAngle) * 8 / zoom, rulerStartY + Math.cos(rulerAngle) * 8 / zoom,
            ]}
            stroke="#ef4444" strokeWidth={2 / zoom}
          />
          <Line
            points={[
              rulerEndX + Math.sin(rulerAngle) * 8 / zoom, rulerEndY - Math.cos(rulerAngle) * 8 / zoom,
              rulerEndX - Math.sin(rulerAngle) * 8 / zoom, rulerEndY + Math.cos(rulerAngle) * 8 / zoom,
            ]}
            stroke="#ef4444" strokeWidth={2 / zoom}
          />
        </Group>
      )}

      {/* Rectangle drawing preview */}
      {showRectangle && (
        <Group>
          <Rect x={rectX} y={rectY} width={rectW} height={rectH} fill={COLORS.selection.fill} stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} dash={[8 / zoom, 4 / zoom]} />
          <Text x={rectX + rectW / 2 - 30} y={rectY - 25 / zoom} text={formatLength(rectWcm)} fontSize={12 / zoom} fill={COLORS.selection.stroke} align="center" />
          <Text x={rectX + rectW + 10 / zoom} y={rectY + rectH / 2 - 6} text={formatLength(rectHcm)} fontSize={12 / zoom} fill={COLORS.selection.stroke} />
          <Circle x={rectStartX} y={rectStartY} radius={6 / zoom} fill="#22c55e" stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} />
          <Circle x={rectEndX}   y={rectEndY}   radius={6 / zoom} fill="#ffffff" stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} />
          <Text x={rectX + rectW / 2 - 40} y={rectY + rectH + 10 / zoom} text={t('releaseToFinish')} fontSize={11 / zoom} fill="#6b7280" />
        </Group>
      )}

      {/* Freeform polygon drawing preview */}
      {showPolygon && (
        <Group>
          {pixelPoints.length > 1 &&
            pixelPoints.slice(0, -1).map((point, index) => {
              const nextPoint = pixelPoints[index + 1];
              const lengthCm = distance(drawingPoints[index], drawingPoints[index + 1]);
              const midX = (point.x + nextPoint.x) / 2;
              const midY = (point.y + nextPoint.y) / 2;
              return (
                <Group key={index}>
                  <Line points={[point.x, point.y, nextPoint.x, nextPoint.y]} stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} dash={[8 / zoom, 4 / zoom]} />
                  <Text x={midX} y={midY - 20 / zoom} text={formatLength(lengthCm)} fontSize={12 / zoom} fill={COLORS.selection.stroke} align="center" />
                </Group>
              );
            })}
          {pixelPoints.map((point, index) => (
            <Group key={index}>
              <Circle x={point.x} y={point.y} radius={6 / zoom} fill={index === 0 ? '#22c55e' : '#ffffff'} stroke={COLORS.selection.stroke} strokeWidth={2 / zoom} />
              {index === 0 && pixelPoints.length > 2 && (
                <Text x={point.x + 10 / zoom} y={point.y - 10 / zoom} text={t('clickToClose')} fontSize={11 / zoom} fill="#22c55e" />
              )}
            </Group>
          ))}
          {pixelPoints.length > 2 && (
            <Line
              points={[pixelPoints[pixelPoints.length - 1].x, pixelPoints[pixelPoints.length - 1].y, pixelPoints[0].x, pixelPoints[0].y]}
              stroke={COLORS.selection.stroke} strokeWidth={1 / zoom} dash={[4 / zoom, 4 / zoom]} opacity={0.5}
            />
          )}
        </Group>
      )}

      {/* Snap indicator — always on top, visible during drawing and corner drag */}
      {snapHighlightPoint && (
        <Circle
          x={snapHighlightPoint.x * PIXELS_PER_CM}
          y={snapHighlightPoint.y * PIXELS_PER_CM}
          radius={8 / zoom}
          stroke={SNAP_INDICATOR_COLOR}
          fill="rgba(34,197,94,0.15)"
          strokeWidth={2 / zoom}
          listening={false}
        />
      )}
    </Group>
  );
}
