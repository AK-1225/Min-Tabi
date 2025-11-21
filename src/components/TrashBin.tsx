import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

const TrashBin = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        fixed bottom-6 right-6 z-40 
        w-16 h-16 rounded-full flex items-center justify-center
        transition-all duration-200 shadow-lg border-2
        ${isOver 
          ? 'bg-red-100 border-red-400 text-red-500 scale-110' 
          : 'bg-white border-stone-200 text-stone-400 hover:border-red-200 hover:text-red-400'
        }
      `}
    >
      <Trash2 size={24} />
    </div>
  );
};

export default TrashBin;