import { memo } from 'react';
import { Rect, Circle, Line } from 'react-konva';
import type { ObjectType } from '../../../types';

interface StairsShapeProps {
  type: ObjectType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const StairsShape = memo(function StairsShape({
  type,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: StairsShapeProps) {
  // Spiral stairs
  if (type === 'stairs-spiral') {
    const radius = Math.min(width, height) / 2;
    return (
      <>
        <Circle
          x={width / 2}
          y={height / 2}
          radius={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <Circle
          x={width / 2}
          y={height / 2}
          radius={radius * 0.2}
          fill="#9ca3af"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </>
    );
  }

  // Straight or L stairs - show steps
  const numSteps = 10;
  const stepHeight = height / numSteps;
  const steps = [];
  for (let i = 0; i < numSteps; i++) {
    steps.push(
      <Line
        key={i}
        points={[0, stepHeight * i, width, stepHeight * i]}
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
      {steps}
    </>
  );
});
