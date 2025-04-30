import React from 'react';
import { BarSvg } from '@/lib/svgs';

type DragHandleProps = {
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
};

const DragHandle: React.FC<DragHandleProps> = ({ onDragStart }) => {
  return (
    <div
      className="drag-handle cursor-move pr-2"
      onDragStart={onDragStart}
      draggable
      aria-label="Drag handle"
    >
      <BarSvg />
    </div>
  );
};

export default DragHandle;