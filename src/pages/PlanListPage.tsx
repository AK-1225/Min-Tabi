import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, ArrowLeft, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  lastVisited?: number;
}

export default function PlanListPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      // LocalStorageから履歴を取得
      const saved = localStorage.getItem('mintabi_history');
      if (!saved) {
        setLoading(false);
        return;
      }

      const items: HistoryItem[] = JSON.parse(saved);
      const validItems: HistoryItem[] = [];

      // タイトルの最新状態を確認（オプション：重ければ削除可）
      for (const item of items) {
        try {
          const docRef = doc(db, 'plans', item.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            validItems.push({
              ...item,
              title: docSnap.data().title || item.title // 最新のタイトルを優先
            });
          } else {
            // DBに存在しないものは履歴として残すが、表示で「削除済み」とわかるようにしてもよい
            // ここでは「アクセス不可」としてリストには残さない運用にするか、残すか。
            // ユーザーの要望は「削除したい」なので、残しておいて手動で削除させる。
             validItems.push({ ...item, title: `${item.title} (存在しません)` });
          }
        } catch (e) {
          validItems.push(item);
        }
      }
      
      setHistory(validItems);
      setLoading(false);
    };

    loadHistory();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`「${title}」を完全に削除しますか？\nこの操作は取り消せません。一緒に計画している人も見れなくなります。`)) {
      return;
    }

    try {
      // 1. Firestoreから削除
      await deleteDoc(doc(db, 'plans', id));
      
      // 2. LocalStorageから削除
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('mintabi_history', JSON.stringify(newHistory));
      
      alert('削除しました');
    } catch (error) {
      console.error("Delete error:", error);
      alert('削除に失敗しました。すでに削除されている可能性があります。');
      // エラーでもローカルからは消す
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('mintabi_history', JSON.stringify(newHistory));
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-stone-700 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white shadow-sm hover:bg-stone-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">作成・閲覧した旅プラン</h1>
        </div>

        {loading ? (
          <div className="text-center text-stone-400 py-10">読み込み中...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-stone-400 py-10 border-2 border-dashed border-orange-200 rounded-xl bg-white/50">
            <p>履歴がありません</p>
            <button onClick={() => navigate('/')} className="mt-4 text-orange-500 font-bold hover:underline">
              新しい旅を作る
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-orange-100 text-orange-500 p-2 rounded-lg">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{item.title}</h3>
                    <p className="text-xs text-stone-400 font-mono truncate">ID: {item.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/plan/${item.id}`)}
                    className="px-3 py-2 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-stone-700 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink size={14} /> 開く
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    title="完全に削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded-xl flex items-start gap-3 text-sm text-blue-800 border border-blue-100">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p>
            <strong>ご注意：</strong> ここでの「削除」は、データベースからの完全削除です。
            URLを知っている他の人も見られなくなりますのでご注意ください。
            ブラウザの履歴（キャッシュ）を削除すると、このリストもリセットされます。
          </p>
        </div>
      </div>
    </div>
  );
}