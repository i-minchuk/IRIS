import { useEffect, useState } from 'react';
import { Zap, Timer } from 'lucide-react';
import type { Tender } from '../types/tender';

interface Props {
  tenders: Tender[];
}

function useCountdown(target: string | undefined) {
  const [remaining, setRemaining] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setRemaining('00:00:00');
        setIsUrgent(false);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      setIsUrgent(diff < 3600000);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return { remaining, isUrgent };
}

function AuctionCard({ tender }: { tender: Tender }) {
  const { remaining, isUrgent } = useCountdown(tender.auction_end_time);

  return (
    <div
      className="rounded-lg border p-4 transition-all duration-200"
      style={{
        borderColor: isUrgent ? 'var(--iris-accent-coral)' : 'var(--iris-border-subtle)',
        background: 'var(--iris-bg-subtle)',
        boxShadow: isUrgent ? '0 0 16px var(--iris-glow-coral)' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {tender.name}
        </span>
        {isUrgent && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--iris-status-bg-coral)', color: 'var(--iris-accent-coral)' }}>
            СРОЧНО
          </span>
        )}
      </div>
      <div className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
        {tender.customer_name} · {tender.platform}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Timer className="h-3.5 w-3.5" style={{ color: isUrgent ? 'var(--iris-accent-coral)' : 'var(--iris-accent-amber)' }} />
        <span className="text-sm font-mono font-bold" style={{ color: isUrgent ? 'var(--iris-accent-coral)' : 'var(--text-primary)' }}>
          {remaining}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <div style={{ color: 'var(--text-muted)' }}>НМЦ</div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {tender.nmc ? `${(tender.nmc / 1_000_000).toFixed(1)} млн ₽` : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Наш предел</div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {tender.our_price ? `${(tender.our_price / 1_000_000).toFixed(1)} млн ₽` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TenderAuctionPanel({ tenders }: Props) {
  const auctionTenders = tenders.filter((t) => t.stage === 'auction');

  if (auctionTenders.length === 0) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5" style={{ color: 'var(--iris-accent-amber)' }} />
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Активные аукционы
          </h3>
        </div>
        <div className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          Нет активных аукционов
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5" style={{ color: 'var(--iris-accent-amber)' }} />
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Активные аукционы
        </h3>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {auctionTenders.length} торг(ов)
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {auctionTenders.map((t) => (
          <AuctionCard key={t.id} tender={t} />
        ))}
      </div>
    </div>
  );
}
