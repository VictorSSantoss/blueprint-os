import { memo } from 'react';
import { Rect } from 'react-konva';

interface BedShapeProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const BedShape = memo(function BedShape({
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: BedShapeProps) {
  const pillowHeight = height * 0.15;

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <Rect
        x={strokeWidth}
        y={strokeWidth}
        width={width - strokeWidth * 2}
        height={pillowHeight}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.5}
      />
    </>
  );
});
