import React, { useState, useEffect } from 'react';
import { ImageIcon, X, Save, Upload, MapPin, Utensils, ExternalLink, Trash2 } from 'lucide-react';
import { CardType } from '../types';

interface EditModalProps {
  card: CardType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: CardType) => void;
  onDelete: (cardId: string) => void;
}

const EditModal = ({ card, isOpen, onClose, onSave, onDelete }: EditModalProps) => {
  const [formData, setFormData] = useState<CardType>(card);
  
  useEffect(() => {
    if (isOpen) {
      setFormData(card);
    }
  }, [isOpen, card]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl: objectUrl });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-orange-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
          <h3 className="font-bold text-lg text-stone-700">詳細・編集</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-200/50 text-stone-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* 画像プレビュー & アップロード */}
          <div className="relative w-full h-40 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 group">
            {formData.imageUrl ? (
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                <ImageIcon size={32} />
                <span className="text-xs mt-2">画像なし</span>
              </div>
            )}
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white font-bold text-sm gap-2">
              <Upload size={16} />
              画像を変更
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          {/* タイトル */}
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">場所・店名</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-stone-50/50"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">カテゴリ</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setFormData({...formData, category: 'spot'})}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all border ${formData.category === 'spot' ? 'bg-emerald-50 border-emerald-400 text-emerald-600 font-bold shadow-sm' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
              >
                <MapPin size={16} /> 観光地
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, category: 'food'})}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all border ${formData.category === 'food' ? 'bg-orange-50 border-orange-400 text-orange-600 font-bold shadow-sm' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
              >
                <Utensils size={16} /> グルメ
              </button>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">URL (Google Map, 食べログ等)</label>
            <div className="relative">
              <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="https://..."
                value={formData.url || ''}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none text-sm bg-stone-50/50"
              />
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">詳細メモ</label>
            <textarea 
              rows={3}
              value={formData.memo || ''}
              onChange={(e) => setFormData({...formData, memo: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none text-sm resize-none bg-stone-50/50"
              placeholder="営業時間、行きたい理由など..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-orange-100 bg-orange-50/30 flex justify-between items-center">
          <button 
            onClick={() => onDelete(card.id)}
            className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} /> 削除
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button 
              onClick={() => { onSave(formData); onClose(); }}
              className="px-4 py-2 text-sm bg-orange-400 text-white font-bold rounded-lg hover:bg-orange-500 shadow-lg shadow-orange-200 transition-all flex items-center gap-1"
            >
              <Save size={16} />
              保存する
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditModal;