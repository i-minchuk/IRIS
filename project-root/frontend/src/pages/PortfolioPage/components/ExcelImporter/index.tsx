// src/pages/PortfolioPage/components/ExcelImporter/index.tsx
import React, { useCallback, useState } from 'react';

interface ExcelImporterProps {
  onImport: (data: any[]) => void;
  acceptedTypes?: string[];
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({
  onImport,
  acceptedTypes = ['.xlsx', '.xls'],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        // const file = files[0];
        setIsProcessing(true);

        try {
          // Здесь будет логика чтения Excel файла
          // Для MVP используем mock-данные
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          const mockData = [
            {
              name: 'Импортированный документ 1',
              type: 'pdf',
              status: 'not_started',
            },
          ];

          onImport(mockData);
        } catch (error) {
          console.error('Error importing Excel:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [onImport]
  );

  return (
    <div className="bg-[#1e293b] rounded-lg p-6 border border-[#334155]">
      <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">
        Импорт из Excel
      </h3>
      <p className="text-[#94a3b8] text-sm mb-4">
        Загрузите Excel-файл с документами для массового импорта
      </p>

      <div className="flex items-center gap-4">
        <input
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="flex-1 text-[#e2e8f0] text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#4F7A4C] file:text-white hover:file:bg-[#3d6b41] disabled:opacity-50"
        />
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-[#94a3b8]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4F7A4C]" />
          <span>Обработка файла...</span>
        </div>
      )}
    </div>
  );
};
