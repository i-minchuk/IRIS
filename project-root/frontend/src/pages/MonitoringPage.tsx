import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Server, Database, Clock, AlertTriangle } from 'lucide-react';

export default function MonitoringPage() {
  const metrics = [
    { label: 'API Latency (p95)', value: '45ms', status: 'ok', icon: Clock },
    { label: 'Error Rate', value: '0.3%', status: 'ok', icon: AlertTriangle },
    { label: 'Active Users', value: '12', status: 'ok', icon: Activity },
    { label: 'DB Connections', value: '8/20', status: 'ok', icon: Database },
    { label: 'CPU Usage', value: '34%', status: 'ok', icon: Server },
    { label: 'Memory Usage', value: '1.2GB / 4GB', status: 'ok', icon: Server },
  ];

  return (
    <div className="px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/integrations" className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Мониторинг системы</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: 'var(--accent-ai)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{m.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success, #22c55e)' }} />
                <span className="text-xs" style={{ color: 'var(--success, #22c55e)' }}>Healthy</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Prometheus Metrics</h2>
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span>http_requests_total</span>
            <span style={{ color: 'var(--text-primary)' }}>1,245</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span>document_uploads_total</span>
            <span style={{ color: 'var(--text-primary)' }}>87</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span>ai_requests_total</span>
            <span style={{ color: 'var(--text-primary)' }}>342</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span>workflow_completions_total</span>
            <span style={{ color: 'var(--text-primary)' }}>56</span>
          </div>
          <div className="flex justify-between py-2">
            <span>auth_failures_total</span>
            <span style={{ color: 'var(--text-primary)' }}>3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
