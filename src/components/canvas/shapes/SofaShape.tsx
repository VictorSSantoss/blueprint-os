import { memo } from 'react';
import { Rect } from 'react-konva';

interface SofaShapeProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const SofaShape = memo(function SofaShape({
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: SofaShapeProps) {
  const backHeight = height * 0.25;

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
        height={backHeight}
        fill="#9ca3af"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.5}
      />
    </>
  );
});
