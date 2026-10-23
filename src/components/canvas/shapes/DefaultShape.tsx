import { memo } from 'react';
import { Rect } from 'react-konva';

interface DefaultShapeProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const DefaultShape = memo(function DefaultShape({
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: DefaultShapeProps) {
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
