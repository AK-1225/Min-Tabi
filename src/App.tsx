import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { MapPin, Plus, Utensils } from 'lucide-react';

// Import Types
import { CardType, DayColumn } from './types';

// Import Data
import { MOCK_INITIAL_CARDS } from './data/mockData';

// Import Components
import TrashBin from './components/TrashBin';
import EditModal from './components/EditModal';
import Card from './components/Card';
import BoardColumn from './components/BoardColumn';

export default function App() {
  // --- State Management ---
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cards, setCards] = useState<CardType[]>(MOCK_INITIAL_CARDS);
  const [days, setDays] = useState<DayColumn[]>([
    { id: 'day-0', title: '1日目', dateLabel: '10/1(土)', dateValue: '2022-10-01', memo: '' },
    { id: 'day-1', title: '2日目', dateLabel: '10/2(日)', dateValue: '2022-10-02', memo: '' },
  ]);
  const [stockFilter, setStockFilter] = useState<'all' | 'spot' | 'food'>('all');

  // Modal State
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Helpers ---
  const stockCards = useMemo(() => {
    let filtered = cards.filter(c => c.columnId === 'stock');
    if (stockFilter !== 'all') {
      filtered = filtered.filter(c => c.category === stockFilter);
    }
    return filtered;
  }, [cards, stockFilter]);

  const getCardsForColumn = (colId: string) => cards.filter(c => c.columnId === colId);

  // --- Handlers ---
  const handleDateChange = (id: string, dateVal: string) => {
    setDays(days.map(d => {
      if (d.id !== id) return d;
      const dateObj = new Date(dateVal);
      const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
      if (isNaN(dateObj.getTime())) return d;
      const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${weekDays[dateObj.getDay()]})`;
      return { ...d, dateLabel: label, dateValue: dateVal };
    }));
  };

  const handleCardSave = (updatedCard: CardType) => {
    setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const handleCardDelete = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
    if (isModalOpen) setIsModalOpen(false);
  };

  const handleCardClick = (card: CardType) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    if (overId === 'trash') return;

    const activeCard = cards.find(c => c.id === activeId);
    const overCard = cards.find(c => c.id === overId);
    if (!activeCard) return;

    const activeColumnId = activeCard.columnId;
    const overColumnId = overCard ? overCard.columnId : (overId.startsWith('day-') || overId === 'stock' ? overId : null);

    if (!overColumnId || activeColumnId === overColumnId) return;

    setCards((prev) => {
      return prev.map((c) => {
        if (c.id === activeId) {
          return { ...c, columnId: overColumnId };
        }
        return c;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    if (over.id === 'trash') {
      handleCardDelete(active.id as string);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      const oldIndex = cards.findIndex(c => c.id === activeId);
      const newIndex = cards.findIndex(c => c.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
         setCards((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' },
      },
    }),
  };

  const activeCard = useMemo(() => cards.find(c => c.id === activeId), [activeId, cards]);

  // --- Render ---
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-full flex flex-col bg-orange-50 text-stone-800 overflow-hidden font-sans">
        
        {/* Header */}
        <header className="h-14 flex-shrink-0 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-4 z-10 border-b border-orange-100/50">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition">
            <div className="bg-gradient-to-tr from-orange-400 to-pink-400 text-white p-1.5 rounded-lg shadow-md shadow-orange-100">
              <MapPin size={18} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-stone-700">みん旅</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const newCard: CardType = {
                  id: `new-${Date.now()}`,
                  title: '新しいスポット',
                  category: 'spot',
                  columnId: 'stock',
                  imageUrl: ''
                };
                setCards([...cards, newCard]);
                setEditingCard(newCard);
                setIsModalOpen(true);
              }}
              className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg transition-transform active:scale-95"
            >
              <Plus size={16} />
              <span>候補追加</span>
            </button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Stock Area */}
          <div className="flex-shrink-0 h-[40%] md:h-[45%] bg-orange-50 flex flex-col border-b border-orange-200/50 shadow-[inset_0_-2px_4px_rgba(251,146,60,0.05)]">
            <div className="px-4 py-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-500 flex items-center gap-1">
                  ストック（候補）
              </h2>
              <div className="flex bg-orange-100/50 p-1 rounded-lg">
                 <button onClick={() => setStockFilter('all')} className={`px-3 py-1 text-xs rounded-md transition-all ${stockFilter === 'all' ? 'bg-white shadow text-stone-700 font-bold' : 'text-stone-400 hover:text-stone-600'}`}>すべて</button>
                 <button onClick={() => setStockFilter('spot')} className={`px-3 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${stockFilter === 'spot' ? 'bg-white shadow text-emerald-600 font-bold' : 'text-stone-400 hover:text-stone-600'}`}><MapPin size={10} /> 観光</button>
                 <button onClick={() => setStockFilter('food')} className={`px-3 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${stockFilter === 'food' ? 'bg-white shadow text-orange-500 font-bold' : 'text-stone-400 hover:text-stone-600'}`}><Utensils size={10} /> グルメ</button>
              </div>
            </div>
            <SortableContext items={stockCards.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
                  {stockCards.map((card) => (
                    <Card key={card.id} card={card} onClick={() => handleCardClick(card)} />
                  ))}
                  {stockCards.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-stone-400 py-10 border-2 border-dashed border-orange-200 rounded-xl">
                      <p className="text-sm">候補地がありません</p>
                      <p className="text-xs mt-1">右上のボタンから追加してください</p>
                    </div>
                  )}
                </div>
              </div>
            </SortableContext>
          </div>

          {/* Schedule Board */}
          <div className="flex-1 bg-orange-100/30 flex flex-col min-h-0 relative overflow-hidden">
              <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
                <div className="h-full flex px-4 py-4 gap-4 min-w-max items-start">
                  {days.map((day) => (
                    <BoardColumn 
                      key={day.id} 
                      column={day} 
                      cards={getCardsForColumn(day.id)}
                      onMemoChange={(id, val) => setDays(days.map(d => d.id === id ? { ...d, memo: val } : d))}
                      onDateChange={handleDateChange}
                      onCardClick={handleCardClick}
                    />
                  ))}
                  <button 
                    onClick={() => {
                      const newId = `day-${days.length}`;
                      setDays([...days, { id: newId, title: `${days.length + 1}日目`, dateLabel: '日付設定', dateValue: '', memo: '' }]);
                    }}
                    className="w-12 h-full max-h-[400px] flex items-center justify-center rounded-xl border-2 border-dashed border-orange-200 text-orange-300 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 transition-all flex-shrink-0"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
          </div>
        </div>

        <TrashBin />

        {editingCard && (
          <EditModal 
            card={editingCard} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleCardSave}
            onDelete={handleCardDelete}
          />
        )}

        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? <Card card={activeCard} isOverlay /> : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}