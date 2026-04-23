import React from 'react';

export const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Администрирование</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Пользователи</h3>
          <p className="text-xs text-gray-500">Управление пользователями и ролями</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Проекты</h3>
          <p className="text-xs text-gray-500">Архивация и настройки проектов</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Система</h3>
          <p className="text-xs text-gray-500">Журнал и параметры системы</p>
        </div>
      </div>
    </div>
  );
};
