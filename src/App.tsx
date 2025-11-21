import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/TopPage';
import BoardPage from './pages/BoardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* トップページ（タイトル入力・作成） */}
        <Route path="/" element={<TopPage />} />
        
        {/* 編集ページ（IDごとに異なるデータを表示） */}
        <Route path="/plan/:planId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}