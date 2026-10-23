import { Group, Rect, Text } from 'react-konva';
import { useCanvasStore, useProjectStore, useSettingsStore, useToolStore } from '../../../stores';
import { COLORS, LOT_OUTLINE_NAME, PIXELS_PER_CM } from '../../../constants';
import { buildableRect } from '../../../utils/lot';

export function LotLayer() {
  const { lot, moveLot } = useProjectStore();
  const { viewport, gridSize } = useCanvasStore();
  const { mode } = useToolStore();
  const { t } = useSettingsStore();
  if (!lot) return null;

  const { zoom } = viewport;
  const px = (cm: number) => cm * PIXELS_PER_CM;
  const b = buildableRect(lot);
  const canDrag = mode === 'select';

  return (
    <Group>
      <Rect
        x={px(b.x)}
        y={px(b.y)}
        width={px(b.width)}
        height={px(b.height)}
        fill={COLORS.lot.buildable}
        stroke={COLORS.lot.setback}
        strokeWidth={1.5 / zoom}
        dash={[8 / zoom, 6 / zoom]}
        listening={false}
      />
      <Group
        name={LOT_OUTLINE_NAME}
        draggable={canDrag}
        onDragEnd={(e) => {
          const dx = Math.round(e.target.x() / PIXELS_PER_CM / gridSize) * gridSize;
          const dy = Math.round(e.target.y() / PIXELS_PER_CM / gridSize) * gridSize;
          e.target.position({ x: 0, y: 0 });
          if (dx !== 0 || dy !== 0) moveLot({ dx, dy });
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container && canDrag) container.style.cursor = 'grab';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      >
        <Rect
          x={px(lot.origin.x)}
          y={px(lot.origin.y)}
          width={px(lot.width)}
          height={px(lot.depth)}
          stroke={COLORS.lot.outline}
          strokeWidth={2.5 / zoom}
          hitStrokeWidth={12 / zoom}
          listening={canDrag}
        />
      </Group>
      <Text
        x={px(lot.origin.x)}
        y={px(lot.origin.y + lot.depth) + 6 / zoom}
        width={px(lot.width)}
        align="center"
        text={t('lotFront')}
        fontSize={12 / zoom}
        fontStyle="bold"
        fill={COLORS.lot.outline}
        listening={false}
      />
    </Group>
  );
}
