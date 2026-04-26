import React from 'react';

export const RemarksPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Замечания</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500">
        <p>Дашборд замечаний в разработке</p>
        <p className="text-sm mt-2">Здесь будет общий реестр замечаний по всем проектам с фильтрами и аналитикой</p>
      </div>
    </div>
  );
};
