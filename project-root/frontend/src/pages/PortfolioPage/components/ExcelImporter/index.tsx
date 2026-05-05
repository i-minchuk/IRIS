// src/pages/PortfolioPage/components/ExcelImporter/index.tsx
import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelImporterProps {
  onImport: (data: any[]) => void;
  acceptedTypes?: string[];
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({
  onImport,
  acceptedTypes = ['.xlsx', '.xls'],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !files[0]) return;

      const file = files[0];
      setIsProcessing(true);
      setError(null);

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });

        // Skip header row, map to objects
        const headers = (jsonData[0] || []).map(String);
        const rows = jsonData.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((h: string, i: number) => {
            obj[h] = (row as unknown[])[i] ?? null;
          });
          return obj;
        });

        onImport(rows);
      } catch (err) {
        setError('Ошибка чтения файла. Убедитесь, что загружен корректный Excel-файл.');
      } finally {
        setIsProcessing(false);
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

      {error && (
        <div className="mt-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};
