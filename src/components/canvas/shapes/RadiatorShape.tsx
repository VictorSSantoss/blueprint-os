import { memo } from 'react';
import { Rect, Line } from 'react-konva';

interface RadiatorShapeProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const RadiatorShape = memo(function RadiatorShape({
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: RadiatorShapeProps) {
  const numLines = Math.floor(width / 8);
  const lineSpacing = width / (numLines + 1);
  const lines = [];

  for (let i = 1; i <= numLines; i++) {
    lines.push(
      <Line
        key={i}
        points={[lineSpacing * i, height * 0.1, lineSpacing * i, height * 0.9]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

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
      {lines}
    </>
  );
});
