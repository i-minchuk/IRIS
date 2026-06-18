import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Settings, BarChart3 } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Интеграции</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/integrations/1c"
          className="p-6 rounded-xl border hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <Database size={20} style={{ color: 'var(--accent-engineering)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>1С:Предприятие</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Экспорт документов и контрактов в формат 1С. Обмен данными с бухгалтерией.
          </p>
        </Link>

        <Link
          to="/monitoring"
          className="p-6 rounded-xl border hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <BarChart3 size={20} style={{ color: 'var(--accent-ai)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Мониторинг</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Prometheus метрики, Grafana dashboards, health checks системы.
          </p>
        </Link>

        <div
          className="p-6 rounded-xl border opacity-60"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <Settings size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Внешние API</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Интеграционный gateway для webhook и API партнёров. (В разработке)
          </p>
        </div>
      </div>
    </div>
  );
}
