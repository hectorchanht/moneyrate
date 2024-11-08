import React from 'react';
import { BarSvg } from '../svgs';

type DragHandleProps = {
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
};

const DragHandle: React.FC<DragHandleProps> = ({ onDragStart }) => {
  return (
    <div
      className="drag-handle cursor-grab px-2"
      onDragStart={onDragStart}
      draggable
      aria-label="Drag handle"
    >
      <BarSvg />
    </div>
  );
};

export default DragHandle;