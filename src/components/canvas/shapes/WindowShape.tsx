import { memo } from 'react';
import { Rect, Line } from 'react-konva';

interface WindowShapeProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const WindowShape = memo(function WindowShape({
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: WindowShapeProps) {
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
      <Line
        points={[0, height / 2, width, height / 2]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <Line
        points={[width / 2, 0, width / 2, height]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </>
  );
});
