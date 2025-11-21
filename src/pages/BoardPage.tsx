import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
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
import { MapPin, Plus, Utensils, Loader2, Layout, Edit3 } from 'lucide-react';

// Import Types & Components
import { CardType, DayColumn } from '../types';
import TrashBin from '../components/TrashBin';
import EditModal from '../components/EditModal';
import Card from '../components/Card';
import BoardColumn from '../components/BoardColumn';

export default function BoardPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  
  // --- State Management ---
  const [planTitle, setPlanTitle] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [days, setDays] = useState<DayColumn[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'spot' | 'food'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Firebase Realtime Listener ---
  useEffect(() => {
    if (!planId) return;

    const unsubscribe = onSnapshot(doc(db, 'plans', planId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // タイトル更新（編集中以外）
        if (document.activeElement?.id !== 'plan-title-input') {
            setPlanTitle(data.title);
        }
        setCards(data.cards || []);
        setDays(data.days || []);
        setIsLoading(false);
        
        // ★ここを変更: ページを開いただけで履歴に追加・更新する処理
        const history = JSON.parse(localStorage.getItem('mintabi_history') || '[]');
        
        // 1. 同じIDが既にあれば削除（重複防止＆先頭に持ってくるため）
        const filteredHistory = history.filter((h: any) => h.id !== planId);
        
        // 2. 最新のタイトルで先頭に追加
        const newHistory = [{ id: planId, title: data.title }, ...filteredHistory];
        
        // 3. 保存
        localStorage.setItem('mintabi_history', JSON.stringify(newHistory));

      } else {
        alert('このプランは見つかりませんでした（削除された可能性があります）');
        navigate('/');
      }
    }, (error) => {
      console.error("DB Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [planId, navigate]);

  // --- Auto Save Function ---
  const saveToDb = useCallback(async (data: { cards?: CardType[], days?: DayColumn[], title?: string }) => {
    if (!planId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'plans', planId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  }, [planId]);

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Helpers ---
  const stockCards = useMemo(() => {
    let filtered = cards.filter(c => c.columnId === 'stock');
    if (stockFilter !== 'all') filtered = filtered.filter(c => c.category === stockFilter);
    return filtered;
  }, [cards, stockFilter]);

  const getCardsForColumn = (colId: string) => cards.filter(c => c.columnId === colId);

  // --- Handlers ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlanTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    saveToDb({ title: planTitle });
  };

  const handleDateChange = (id: string, dateVal: string) => {
    const newDays = days.map(d => {
      if (d.id !== id) return d;
      const dateObj = new Date(dateVal);
      const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
      if (isNaN(dateObj.getTime())) return d;
      const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${weekDays[dateObj.getDay()]})`;
      return { ...d, dateLabel: label, dateValue: dateVal };
    });
    setDays(newDays);
    saveToDb({ cards, days: newDays });
  };

  const handleMemoChange = (id: string, val: string) => {
    const newDays = days.map(d => d.id === id ? { ...d, memo: val } : d);
    setDays(newDays);
  };

  const handleBlur = () => {
    saveToDb({ cards, days });
  };

  const handleCardSave = (updatedCard: CardType) => {
    const newCards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    setCards(newCards);
    saveToDb({ cards: newCards, days });
  };

  const handleCardDelete = (cardId: string) => {
    const newCards = cards.filter(c => c.id !== cardId);
    setCards(newCards);
    saveToDb({ cards: newCards, days });
    if (isModalOpen) setIsModalOpen(false);
  };

  const handleCardClick = (card: CardType) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  // --- DnD Handlers ---
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
      const newCards = cards.filter(c => c.id !== active.id);
      setCards(newCards);
      saveToDb({ cards: newCards, days });
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      const oldIndex = cards.findIndex(c => c.id === activeId);
      const newIndex = cards.findIndex(c => c.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
         const newCards = arrayMove(cards, oldIndex, newIndex);
         setCards(newCards);
         saveToDb({ cards: newCards, days });
      }
    } else {
      saveToDb({ cards, days });
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  const activeCard = useMemo(() => cards.find(c => c.id === activeId), [activeId, cards]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-orange-50 text-orange-400 gap-2">
        <Loader2 className="animate-spin" /> 読み込み中...
      </div>
    );
  }

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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition group flex-shrink-0">
              <div className="bg-gradient-to-tr from-orange-400 to-pink-400 text-white p-1.5 rounded-lg shadow-md shadow-orange-100 group-hover:scale-105 transition-transform">
                <MapPin size={18} strokeWidth={2.5} />
              </div>
              <h1 className="font-bold text-lg tracking-tight text-stone-700 hidden md:block">みん旅</h1>
            </button>
            <div className="h-6 w-px bg-stone-200 mx-1 flex-shrink-0"></div>
            
            {/* 編集可能なタイトル */}
            <div className="relative group flex-1 max-w-md">
              <input 
                id="plan-title-input"
                type="text"
                value={planTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                className="w-full bg-transparent font-bold text-stone-700 text-sm md:text-base px-2 py-1 rounded hover:bg-stone-100 focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none transition-all truncate"
              />
              <Edit3 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 opacity-0 group-hover:opacity-100 pointer-events-none" />
            </div>

            {isSaving && <span className="text-[10px] text-stone-400 flex-shrink-0 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/>保存中</span>}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/')}
              className="bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors hidden sm:flex"
            >
              <Layout size={14} />
              <span>新規プラン作成</span>
            </button>

            <button 
              onClick={() => {
                const newCard: CardType = {
                  id: `new-${Date.now()}`,
                  title: '新しいスポット',
                  category: 'spot',
                  columnId: 'stock',
                  imageUrl: ''
                };
                const newCards = [...cards, newCard];
                setCards(newCards);
                saveToDb({ cards: newCards, days });
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
          <div className="flex-shrink-0 min-h-[200px] max-h-[50vh] bg-orange-50 flex flex-col border-b border-orange-200/50 shadow-[inset_0_-2px_4px_rgba(251,146,60,0.05)] transition-all duration-300 ease-in-out">
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
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
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
                    <div key={day.id} onBlur={handleBlur}>
                        <BoardColumn 
                        column={day} 
                        cards={getCardsForColumn(day.id)}
                        onMemoChange={handleMemoChange}
                        onDateChange={handleDateChange}
                        onCardClick={handleCardClick}
                        />
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newId = `day-${days.length}-${Date.now()}`;
                      const newDays = [...days, { id: newId, title: `${days.length + 1}日目`, dateLabel: '日付設定', dateValue: '', memo: '' }];
                      setDays(newDays);
                      saveToDb({ cards, days: newDays });
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