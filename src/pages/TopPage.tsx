import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, ArrowRight, Clock } from 'lucide-react';
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
        // 初期データを入れる
        cards: MOCK_INITIAL_CARDS,
        days: [
          { id: 'day-0', title: '1日目', dateLabel: '日付未定', dateValue: '', memo: '' },
          { id: 'day-1', title: '2日目', dateLabel: '日付未定', dateValue: '', memo: '' },
        ]
      });

      // 2. 履歴に保存
      const newHistory = [{ id: docRef.id, title }, ...history].slice(0, 5); // 最新5件
      localStorage.setItem('mintabi_history', JSON.stringify(newHistory));

      // 3. 編集画面へ移動
      navigate(`/plan/${docRef.id}`);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("作成に失敗しました。通信環境を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 text-stone-700 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-orange-100">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-orange-400 to-pink-400 text-white p-4 rounded-2xl shadow-lg shadow-orange-200 transform -rotate-3">
            <MapPin size={40} strokeWidth={2.5} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">みん旅をはじめよう</h1>
        <p className="text-stone-400 text-center text-sm mb-8">友達や恋人と、リアルタイムで旅の計画を。</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">旅のタイトル</label>
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

        {history.length > 0 && (
          <div className="mt-10 pt-6 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-400 mb-3 flex items-center gap-1">
              <Clock size={12} /> 最近チェックした旅
            </h3>
            <div className="space-y-2">
              {history.map(h => (
                <button
                  key={h.id}
                  onClick={() => navigate(`/plan/${h.id}`)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 text-sm text-stone-600 flex justify-between items-center group transition-colors"
                >
                  <span className="truncate flex-1">{h.title}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-orange-400 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}