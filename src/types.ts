export type Category = 'spot' | 'food';

export interface CardType {
  id: string;
  title: string;
  category: Category;
  imageUrl?: string;
  url?: string;     // マップ等のURL
  columnId: string; // 'stock' 或者是 'day-0', 'day-1' 等
  memo?: string;    // 詳細メモ
}

export interface DayColumn {
  id: string; // 'day-0', 'day-1'...
  title: string;
  dateLabel: string; // 表示用の日付文字列 (例: 10/1)
  dateValue?: string; // input[type="date"] 用の値 (例: 2023-10-01)
  memo: string;
}