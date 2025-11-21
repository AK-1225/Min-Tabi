import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/TopPage';
import BoardPage from './pages/BoardPage';
import PlanListPage from './pages/PlanListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* トップページ */}
        <Route path="/" element={<TopPage />} />
        
        {/* プラン一覧・管理ページ */}
        <Route path="/plans" element={<PlanListPage />} />

        {/* 編集ページ */}
        <Route path="/plan/:planId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}