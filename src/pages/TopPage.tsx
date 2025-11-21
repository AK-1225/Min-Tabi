import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, ArrowRight, Clock, List } from 'lucide-react';
import { MOCK_INITIAL_CARDS } from '../data/mockData';

export default function TopPage() {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{id: string, title: string}[]>([]);
  const navigate = useNavigate();

  // 履歴の読み込み
  useEffect(() => {
    const saved = localStorage.getItem('mintabi_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);

    try {
      // 1. Firestoreに新しいプランを作成
      const docRef = await addDoc(collection(db, 'plans'), {
        title: title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        cards: MOCK_INITIAL_CARDS,
        days: [
          { id: 'day-0', title: '1日目', dateLabel: '日付未定', dateValue: '', memo: '' },
          { id: 'day-1', title: '2日目', dateLabel: '日付未定', dateValue: '', memo: '' },
        ]
      });

      // 2. 履歴に保存
      const newHistory = [{ id: docRef.id, title }, ...history];
      // 重複排除
      const uniqueHistory = Array.from(new Map(newHistory.map(item => [item.id, item])).values());
      
      localStorage.setItem('mintabi_history', JSON.stringify(uniqueHistory));

      // 3. 編集画面へ移動
      navigate(`/plan/${docRef.id}`);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("作成に失敗しました。通信環境を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      navigate(`/plan/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 text-stone-700 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-orange-100 relative">
        
        {/* 管理ページへのリンク */}
        <button 
          onClick={() => navigate('/plans')}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
          title="プラン一覧・削除"
        >
          <List size={20} />
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-orange-400 to-pink-400 text-white p-4 rounded-2xl shadow-lg shadow-orange-200 transform -rotate-3">
            <MapPin size={40} strokeWidth={2.5} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">みん旅をはじめよう</h1>
        <p className="text-stone-400 text-center text-sm mb-8">友達や恋人と、リアルタイムで旅の計画を。</p>

        <form onSubmit={handleCreate} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">新しい旅のタイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 2泊3日 京都食い倒れ旅行"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl shadow-lg shadow-stone-200 hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? '作成中...' : <>旅をつくる <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* 履歴プルダウンエリア */}
        {history.length > 0 && (
          <div className="pt-6 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-400 mb-2 flex items-center gap-1">
              <Clock size={12} /> 最近の旅を再開
            </label>
            <div className="relative">
              <select 
                onChange={handleHistorySelect}
                className="w-full appearance-none bg-orange-50 text-stone-600 text-sm px-4 py-2.5 rounded-lg border border-orange-100 focus:ring-2 focus:ring-orange-200 outline-none cursor-pointer hover:border-orange-300 transition-all"
                defaultValue=""
              >
                <option value="" disabled>選択してください...</option>
                {history.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
              <ArrowRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
            
            <div className="mt-3 text-right">
               <button 
                 onClick={() => navigate('/plans')}
                 className="text-xs text-orange-500 hover:underline flex items-center justify-end gap-1 ml-auto"
               >
                 一覧・削除はこちら <ArrowRight size={10} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}