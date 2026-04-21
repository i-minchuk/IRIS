// frontend/src/app/Layout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">IRIS</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};