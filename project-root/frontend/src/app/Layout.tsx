import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#1E2230]">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#1E2230]">
        <Outlet />
      </main>
    </div>
  );
};
