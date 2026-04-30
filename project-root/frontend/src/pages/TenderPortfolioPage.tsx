import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Tender, TenderStage, TenderSummary, TenderTask } from '@/features/tenders/types/tender';
import { getTenders, getTenderSummary } from '@/features/tenders/api/tenders';
import { mockTenders, mockSummary, mockTasks } from '@/features/tenders/mocks/tenderData';
import { TenderKPIHeader } from '@/features/tenders/components/TenderKPIHeader';
import { TenderPipeline } from '@/features/tenders/components/TenderPipeline';
import { TenderAuctionPanel } from '@/features/tenders/components/TenderAuctionPanel';
import { TenderRegistry } from '@/features/tenders/components/TenderRegistry';
import { TenderTaskPanel } from '@/features/tenders/components/TenderTaskPanel';
import { TenderAnalytics } from '@/features/tenders/components/TenderAnalytics';

export default function TenderPortfolioPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [summary, setSummary] = useState<TenderSummary | null>(null);
  const [tasks] = useState<TenderTask[]>(mockTasks);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<TenderStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Try real API first, fallback to mocks
        try {
          const [tendersData, summaryData] = await Promise.all([
            getTenders(),
            getTenderSummary(),
          ]);
          setTenders(tendersData);
          setSummary(summaryData);
        } catch {
          // Fallback to mocks for demo/development
          setTenders(mockTenders);
          setSummary(mockSummary);
        }
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные портфеля заказов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStageClick = (stage: TenderStage) => {
    setSelectedStage((prev) => (prev === stage ? null : stage));
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Портфель заказов
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управление воронкой заказов, аукционами и подготовкой заявок
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 hover:brightness-110"
          style={{
            background: 'var(--iris-accent-cyan)',
            color: 'var(--iris-text-inverse)',
            boxShadow: '0 0 12px var(--iris-glow-cyan)',
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Новый заказ
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--iris-accent-coral)', background: 'var(--iris-status-bg-coral)' }}>
          <p className="text-sm" style={{ color: 'var(--iris-accent-coral)' }}>{error}</p>
        </div>
      )}

      {/* KPI Header */}
      <TenderKPIHeader summary={summary} loading={loading} />

      {/* Pipeline */}
      <TenderPipeline
        tenders={tenders}
        summary={summary}
        onStageClick={handleStageClick}
      />

      {/* Auctions */}
      <TenderAuctionPanel tenders={tenders} />

      {/* Registry */}
      <TenderRegistry tenders={tenders} selectedStage={selectedStage} />

      {/* Tasks + Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <TenderTaskPanel tasks={tasks} />
        </div>
        <div className="lg:col-span-2">
          <TenderAnalytics summary={summary} />
        </div>
      </div>
    </div>
  );
}
