import { memo } from 'react';
import { Rect, Circle, Line } from 'react-konva';
import type { ObjectType } from '../../../types';

interface ApplianceShapeProps {
  type: ObjectType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const ApplianceShape = memo(function ApplianceShape({
  type,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: ApplianceShapeProps) {
  // Refrigerator - show door line
  if (type === 'refrigerator') {
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
          points={[0, height * 0.35, width, height * 0.35]}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </>
    );
  }

  // Cooktop - show burners
  if (type === 'cooktop') {
    const burnerRadius = Math.min(width, height) * 0.15;
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
        <Circle x={width * 0.25} y={height * 0.35} radius={burnerRadius} fill="#374151" />
        <Circle x={width * 0.75} y={height * 0.35} radius={burnerRadius} fill="#374151" />
        <Circle x={width * 0.25} y={height * 0.65} radius={burnerRadius * 0.8} fill="#374151" />
        <Circle x={width * 0.75} y={height * 0.65} radius={burnerRadius * 0.8} fill="#374151" />
      </>
    );
  }

  // Default appliance shape
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
