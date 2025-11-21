import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImageIcon, MapPin, Utensils, ExternalLink } from 'lucide-react';
import { CardType } from '../types';

interface CardProps {
  card: CardType;
  isOverlay?: boolean; // ドラッグ中の見た目用フラグ
  onClick?: () => void;
}

const Card = ({ card, isOverlay, onClick }: CardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const baseClasses = `
    relative group touch-none select-none
    bg-white rounded-xl p-3 mb-3 w-full
    transition-all duration-200
    border border-orange-100/50
    flex items-start gap-3
  `;

  const glowClass = card.category === 'spot'
    ? 'shadow-[0_4px_15px_-3px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_20px_-2px_rgba(16,185,129,0.3)]'
    : 'shadow-[0_4px_15px_-3px_rgba(249,115,22,0.15)] hover:shadow-[0_4px_20px_-2px_rgba(249,115,22,0.3)]';

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`opacity-40 ${baseClasses} border-dashed border-orange-300 bg-orange-50`}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`${baseClasses} ${glowClass} ${isOverlay ? 'scale-105 cursor-grabbing z-50' : 'cursor-grab'}`}
    >
      {/* 画像エリア */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-stone-100 relative">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <ImageIcon size={20} />
          </div>
        )}
        <div className={`absolute bottom-0 right-0 p-1 rounded-tl-md text-white ${card.category === 'spot' ? 'bg-emerald-400/90' : 'bg-orange-400/90'}`}>
          {card.category === 'spot' ? <MapPin size={10} /> : <Utensils size={10} />}
        </div>
      </div>

      {/* テキスト情報エリア */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-stone-700 text-sm truncate mb-1">{card.title}</h4>
        <div className="flex gap-2 mb-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${card.category === 'spot' ? 'bg-emerald-300' : 'bg-orange-300'}`}>
            {card.category === 'spot' ? '観光' : 'グルメ'}
          </span>
          {card.url && (
            <a 
              href={card.url} 
              target="_blank" 
              rel="noreferrer"
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={(e) => e.stopPropagation()}
              className="text-stone-400 hover:text-orange-500"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        {card.memo && (
          <p className="text-[10px] text-stone-400 truncate">{card.memo}</p>
        )}
      </div>
    </div>
  );
};

export default Card;