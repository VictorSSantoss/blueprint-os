import { memo } from 'react';
import { Rect, Circle } from 'react-konva';
import type { ObjectType } from '../../../types';

interface BathroomShapeProps {
  type: ObjectType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const BathroomShape = memo(function BathroomShape({
  type,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: BathroomShapeProps) {
  // Toilet - oval shape
  if (type === 'toilet') {
    return (
      <>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height * 0.35}
          fill="#e5e7eb"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <Circle
          x={width / 2}
          y={height * 0.6}
          radiusX={width * 0.45}
          radiusY={height * 0.35}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </>
    );
  }

  // Bathtub - rounded rectangle
  if (type === 'bathtub') {
    return (
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={10}
      />
    );
  }

  // Default bathroom fixture
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
