import React, { useState } from 'react';

export const WorkflowPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'active' | 'my_tasks'>('active');

  return (
    <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b] border-b border-[#334155]">
        <h1 className="text-lg font-bold">🔄 МАРШРУТ СОГЛАСОВАНИЯ</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-[#3b82f6] rounded text-xs font-bold text-white hover:bg-[#2563eb]">
            + Новый маршрут
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#334155] bg-[#1e293b]">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Активные ({5})
        </button>
        <button
          onClick={() => setActiveTab('my_tasks')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'my_tasks'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Мои задачи ({3})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Шаблоны ({4})
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'active' && (
          <div className="text-center text-[#64748b] py-12">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm font-bold">Активные маршруты согласования</div>
            <div className="text-xs mt-2">Здесь будут отображаться запущенные процессы</div>
          </div>
        )}

        {activeTab === 'my_tasks' && (
          <div className="text-center text-[#64748b] py-12">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-sm font-bold">Мои задачи на согласование</div>
            <div className="text-xs mt-2">Задачи, требующие вашего участия</div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="text-center text-[#64748b] py-12">
            <div className="text-4xl mb-3">📐</div>
            <div className="text-sm font-bold">Шаблоны маршрутов</div>
            <div className="text-xs mt-2">Стандартный, Ускоренный, Тендерный, Кастомный</div>
          </div>
        )}
      </div>
    </div>
  );
};
