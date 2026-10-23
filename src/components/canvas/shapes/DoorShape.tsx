import { memo } from 'react';
import { Rect, Line, Arc } from 'react-konva';
import type { ObjectType } from '../../../types';

interface DoorShapeProps {
  type: ObjectType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const DoorShape = memo(function DoorShape({
  type,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: DoorShapeProps) {
  const isDouble = type === 'double-door' || type === 'french-door';
  const isSliding = type === 'sliding-door' || type === 'pocket-door';

  if (isSliding) {
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
          points={[width / 4, height / 2, (width * 3) / 4, height / 2]}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <Line
          points={[
            (width * 3) / 4 - 8,
            height / 2 - 4,
            (width * 3) / 4,
            height / 2,
            (width * 3) / 4 - 8,
            height / 2 + 4,
          ]}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </>
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
      <Arc
        x={0}
        y={height}
        innerRadius={0}
        outerRadius={width * 0.9}
        angle={90}
        rotation={-90}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {isDouble && (
        <Arc
          x={width}
          y={height}
          innerRadius={0}
          outerRadius={width * 0.45}
          angle={90}
          rotation={180}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      )}
    </>
  );
});
