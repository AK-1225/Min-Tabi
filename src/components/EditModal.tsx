import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, X, Save, Upload, MapPin, Utensils, ExternalLink, Trash2, Link, Loader2 } from 'lucide-react';
import { CardType } from '../types';

interface EditModalProps {
  card: CardType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: CardType) => void;
  onDelete: (cardId: string) => void;
}

// ★追加: 画像を圧縮してBase64文字列に変換する関数
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // 最大サイズを500pxに制限（容量削減のため）
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // JPEG形式、品質0.7で圧縮してBase64化
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const EditModal = ({ card, isOpen, onClose, onSave, onDelete }: EditModalProps) => {
  const [formData, setFormData] = useState<CardType>(card);
  const [isProcessing, setIsProcessing] = useState(false); // 画像処理中フラグ
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setFormData(card);
    }
  }, [isOpen, card]);

  if (!isOpen) return null;

  // ファイル選択時の処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        // 圧縮してBase64に変換
        const base64Image = await compressImage(file);
        setFormData({ ...formData, imageUrl: base64Image });
      } catch (error) {
        console.error("Image processing failed", error);
        alert("画像の処理に失敗しました");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // ペースト時の処理
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;

    // 1. 画像ファイル（バイナリ）を探す
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setIsProcessing(true);
          try {
            const base64Image = await compressImage(file);
            setFormData(prev => ({ ...prev, imageUrl: base64Image }));
            foundImage = true;
          } catch (error) {
            console.error("Paste processing failed", error);
          } finally {
            setIsProcessing(false);
          }
          e.preventDefault();
          return;
        }
      }
    }

    // 2. テキスト（URL）を探す
    if (!foundImage) {
      const text = e.clipboardData.getData('text');
      if (text && (text.startsWith('http') || text.startsWith('data:image'))) {
        setFormData(prev => ({ ...prev, imageUrl: text }));
        e.preventDefault();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
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
          
          {/* 画像プレビュー & アップロード & ペーストエリア */}
          <div 
            ref={imageContainerRef}
            tabIndex={0}
            onPaste={handlePaste}
            className="relative w-full h-40 bg-stone-100 rounded-xl overflow-hidden border-2 border-stone-200 border-dashed group outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all"
          >
            {isProcessing ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-orange-400">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-xs mt-2 font-bold">画像を処理中...</span>
              </div>
            ) : formData.imageUrl ? (
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 pointer-events-none">
                <ImageIcon size={32} />
                <span className="text-xs mt-2 font-medium">画像なし</span>
              </div>
            )}
            
            {/* オーバーレイラベル */}
            {!isProcessing && (
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white font-bold text-sm gap-2 hover:opacity-100">
                <div className="flex items-center gap-2">
                  <Upload size={16} />
                  <span>クリックして選択</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {/* スマホ用ペースト入力欄 */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <Link size={14} />
            </div>
            <input
              type="text"
              placeholder="ここに画像のURLをペースト (スマホ用)"
              onPaste={handlePaste}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none placeholder:text-stone-400"
            />
          </div>
          <p className="text-[10px] text-stone-400 text-right -mt-2">
            ※ スマホでは「画像アドレスをコピー」してここに貼り付けてください
          </p>

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
              disabled={isProcessing}
              className="px-4 py-2 text-sm bg-orange-400 text-white font-bold rounded-lg hover:bg-orange-500 shadow-lg shadow-orange-200 transition-all flex items-center gap-1 disabled:opacity-50"
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