import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, FileCheck, Clock, Users, BarChart3, Shield, BookOpen, Archive, Factory, Briefcase, Zap } from 'lucide-react';
import { ChromeBot } from '@/components/ChromeBot';

export type PageType = 
  | 'dashboard' 
  | 'portfolio' 
  | 'documents' 
  | 'production' 
  | 'archive' 
  | 'admin' 
  | 'references' 
  | 'reports' 
  | 'team' 
  | 'time-tracking' 
  | 'profile';

interface Recommendation {
  icon: React.ReactNode;
  text: React.ReactNode;
  action?: { label: string; path: string };
  secondaryAction?: { label: string; path: string };
  type: 'success' | 'warning' | 'info' | 'danger';
}

const recommendations: Record<PageType, Recommendation[]> = {
  dashboard: [
    {
      icon: <TrendingUp size={18} />,
      text: <>Перегруз тендерного отдела: <strong>85%</strong>. Переложить <strong>КЖ-02-014</strong> на проектный?</>,
      action: { label: 'Применить', path: '/team' },
      secondaryAction: { label: 'Подробнее', path: '/workflow' },
      type: 'success',
    },
  ],
  portfolio: [
    {
      icon: <Briefcase size={18} />,
      text: <>Проект <strong>КЖ-02-014</strong> отстаёт от графика на <strong>12 дней</strong>. Рекомендуется перераспределить ресурсы ПТО.</>,
      action: { label: 'Перейти к проекту', path: '/portfolio?tab=projects' },
      type: 'warning',
    },
    {
      icon: <Zap size={18} />,
      text: <>Тендер <strong>Т-2026-008</strong> требует срочного обновления КП. Дедлайн через <strong>2 дня</strong>.</>,
      action: { label: 'Открыть тендер', path: '/portfolio?tab=tenders' },
      type: 'danger',
    },
  ],
  documents: [
    {
      icon: <FileCheck size={18} />,
      text: <>У <strong>7 документов</strong> истекает срок согласования. Рекомендуется запустить ускоренный процесс утверждения.</>,
      action: { label: 'Посмотреть', path: '/documents?filter=overdue' },
      type: 'warning',
    },
    {
      icon: <AlertTriangle size={18} />,
      text: <>Обнаружены <strong>3 дублирующих</strong> чертежа в проекте <strong>ОВ-2026-003</strong>. Рекомендуется провести аудит.</>,
      action: { label: 'Аудит', path: '/documents?project=ОВ-2026-003' },
      type: 'danger',
    },
  ],
  production: [
    {
      icon: <Factory size={18} />,
      text: <>Загрузка производственного участка <strong>АСУТП</strong> превышает <strong>92%</strong>. Возможен срыв сроков КЖ-02-014.</>,
      action: { label: 'Перераспределить', path: '/production?tab=schedule' },
      type: 'warning',
    },
    {
      icon: <Clock size={18} />,
      text: <>Этап <strong>«Монтаж КИПиА»</strong> по объекту <strong>КЖ-02-014</strong> отстаёт на <strong>8 дней</strong>.</>,
      action: { label: 'Детали', path: '/production?tab=tracking' },
      type: 'info',
    },
  ],
  archive: [
    {
      icon: <Archive size={18} />,
      text: <>Архив проекта <strong>КЖ-2025-001</strong> неполный — отсутствуют <strong>исполнительные схемы</strong>. Требуется дозагрузка.</>,
      action: { label: 'Дозагрузить', path: '/archive?project=КЖ-2025-001' },
      type: 'warning',
    },
  ],
  admin: [
    {
      icon: <Shield size={18} />,
      text: <>Обнаружено <strong>2 подозрительных</strong> входа с неизвестных IP. Рекомендуется проверить журнал аудита.</>,
      action: { label: 'Журнал аудита', path: '/admin/audit' },
      type: 'danger',
    },
    {
      icon: <Users size={18} />,
      text: <>У <strong>5 пользователей</strong> истекает срок действия пароля. Рекомендуется инициировать смену.</>,
      action: { label: 'Управление пользователями', path: '/admin/users' },
      type: 'info',
    },
  ],
  references: [
    {
      icon: <BookOpen size={18} />,
      text: <>Справочник <strong>«Материалы и оборудование»</strong> требует обновления — добавлено <strong>47 новых позиций</strong> ГОСТ 2026.</>,
      action: { label: 'Обновить', path: '/references?tab=materials' },
      type: 'info',
    },
  ],
  reports: [
    {
      icon: <BarChart3 size={18} />,
      text: <>Отчёт <strong>«Анализ эффективности ПТО»</strong> за Q2 готов. Выявлено повышение производительности на <strong>18%</strong>.</>,
      action: { label: 'Открыть отчёт', path: '/reports?report=efficiency' },
      type: 'success',
    },
  ],
  team: [
    {
      icon: <Users size={18} />,
      text: <>Сотрудник <strong>Иванов А.П.</strong> перегружен — <strong>56 часов</strong> в неделю. Рекомендуется перераспределить задачи.</>,
      action: { label: 'Перераспределить', path: '/team?tab=load' },
      type: 'warning',
    },
  ],
  'time-tracking': [
    {
      icon: <Clock size={18} />,
      text: <>У <strong>3 сотрудников</strong> не заполнены таймшиты за прошлую неделю. Дедлайн подачи — <strong>сегодня</strong>.</>,
      action: { label: 'Напомнить', path: '/time-tracking?tab=missing' },
      type: 'warning',
    },
  ],
  profile: [
    {
      icon: <Shield size={18} />,
      text: <>Рекомендуется включить <strong>двухфакторную аутентификацию</strong> для повышения безопасности аккаунта.</>,
      action: { label: 'Включить 2FA', path: '/profile/2fa' },
      type: 'info',
    },
  ],
};

const typeStyles = {
  success: { bg: 'rgba(12,114,5,0.08)', border: 'rgba(12,114,5,0.2)', icon: '#0C7205' },
  warning: { bg: 'rgba(212,166,42,0.08)', border: 'rgba(212,166,42,0.2)', icon: '#D4A62A' },
  info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: '#3B82F6' },
  danger: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', icon: '#DC2626' },
};

interface IRISRecommendationsProps {
  page: PageType;
  isDark?: boolean;
}

export function IRISRecommendations({ page, isDark = false }: IRISRecommendationsProps) {
  const navigate = useNavigate();
  const items = recommendations[page] || [];

  if (items.length === 0) return null;

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2 mb-3">
        <ChromeBot size={48} variant={isDark ? 'dark' : 'light'} />
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Рекомендации IRIS</h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-ассистент</span>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const style = typeStyles[item.type];
          return (
            <div key={idx} className="p-2.5 rounded-lg" style={{ background: isDark ? style.bg.replace('0.08', '0.12') : style.bg, border: `1px solid ${style.border}` }}>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: style.icon }}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{item.text}</p>
                  {(item.action || item.secondaryAction) && (
                    <div className="flex items-center gap-2 mt-2">
                      {item.action && (
                        <button
                          onClick={() => navigate(item.action!.path)}
                          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors hover:brightness-110"
                          style={{ background: style.icon, color: '#fff' }}
                        >
                          {item.action.label}
                        </button>
                      )}
                      {item.secondaryAction && (
                        <button
                          onClick={() => navigate(item.secondaryAction!.path)}
                          className="text-xs px-3 py-1.5 rounded-md transition-colors"
                          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                        >
                          {item.secondaryAction.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
