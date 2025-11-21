import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { DayColumn, CardType } from '../types';
import Card from './Card';

interface BoardColumnProps {
  column: DayColumn;
  cards: CardType[];
  onMemoChange: (id: string, val: string) => void;
  onDateChange: (id: string, dateVal: string) => void;
  onCardClick: (card: CardType) => void;
}

const BoardColumn = ({ column, cards, onMemoChange, onDateChange, onCardClick }: BoardColumnProps) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex-shrink-0 w-[280px] md:w-[320px] flex flex-col h-full max-h-full rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm p-3 snap-center"
    >
      {/* ヘッダー (日付選択機能付き) */}
      <div className="mb-3 flex justify-between items-center">
        <h3 className="font-bold text-stone-700">{column.title}</h3>
        
        {/* 日付ピッカーエリア */}
        <div className="relative group">
          <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer hover:text-orange-500 hover:bg-orange-100/50 px-2 py-1 rounded transition-colors">
            <CalendarIcon size={12} />
            <span className="font-medium">{column.dateLabel}</span>
            <input
              type="date"
              value={column.dateValue || ''}
              onChange={(e) => onDateChange(column.id, e.target.value)}
              /* --- ↓↓↓ ここを追加・修正しました ↓↓↓ --- */
              onClick={(e) => {
                try {
                  // PCでもクリック時にカレンダーを強制的に開く
                  (e.currentTarget as HTMLInputElement).showPicker();
                } catch (err) {
                  // showPicker未対応ブラウザの場合は何もしない
                }
              }}
              /* --- ↑↑↑ ここまで ↑↑↑ --- */
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* メモ欄 */}
      <textarea
        className="w-full text-xs p-2 mb-3 rounded-lg bg-white/80 border-none shadow-sm focus:ring-2 focus:ring-orange-200 resize-none h-16 placeholder:text-stone-300 text-stone-600"
        placeholder="メモ: 10:00 東京駅発..."
        value={column.memo}
        onChange={(e) => onMemoChange(column.id, e.target.value)}
      />

      {/* カードリストエリア */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[100px] px-1 pb-10">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
          {cards.length === 0 && (
            <div className="h-20 flex items-center justify-center border-2 border-dashed border-orange-200/50 rounded-lg text-orange-200 text-xs pointer-events-none">
              ここにドロップ
            </div>
          )}
        </SortableContext>
      </div>

      {/* 地図で見るボタン */}
      <button className="mt-2 py-2 w-full text-xs font-bold text-orange-500 bg-orange-50/80 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-1">
        <MapPin size={12} />
        地図で見る
      </button>
    </div>
  );
};

export default BoardColumn;