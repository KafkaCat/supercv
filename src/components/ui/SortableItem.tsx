import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onRemove?: () => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full px-2 py-2 cursor-move text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity touch-none"
      >
        <GripVertical size={16} />
      </div>
      {children}
      {onRemove && (
        <button 
           onClick={(e) => {
             e.stopPropagation();
             onRemove();
           }}
           className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
