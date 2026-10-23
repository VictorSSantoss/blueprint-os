import { memo } from 'react';
import { Rect, Circle } from 'react-konva';
import type { ObjectType } from '../../../types';

interface TableShapeProps {
  type: ObjectType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const TableShape = memo(function TableShape({
  type,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: TableShapeProps) {
  // Round table
  if (type === 'round-table-4') {
    const radius = Math.min(width, height) / 2;
    return (
      <Circle
        x={width / 2}
        y={height / 2}
        radius={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Default rectangular table
  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
});
