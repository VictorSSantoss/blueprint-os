import { memo } from 'react';
import { Rect, Circle } from 'react-konva';
import type { ObjectType } from '../../../types';

interface StructuralShapeProps {
  type: ObjectType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const StructuralShape = memo(function StructuralShape({
  type,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: StructuralShapeProps) {
  // Round column
  if (type === 'column-round') {
    const radius = Math.min(width, height) / 2;
    return (
      <Circle
        x={width / 2}
        y={height / 2}
        radius={radius}
        fill="#9ca3af"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Square column or other structural elements
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
