import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Phone, Copy, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getEmployeeDirectory, type EmployeeContact } from '@/features/users/api/users';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  engineer: 'Инженер',
  norm_controller: 'Нормоконтролер',
  department_head: 'Начальник отдела',
  gip: 'ГИП',
  site_manager: 'Руководитель участка',
  deputy_director: 'Зам. директора',
  director: 'Директор',
  product_owner: 'Владелец продукта',
  system_admin: 'Системный администратор',
  tech_support: 'Техподдержка',
  content_editor: 'Редактор',
};

const AVATAR_COLORS = [
  'var(--iris-accent-cyan)',
  'var(--iris-accent-blue)',
  'var(--iris-accent-purple)',
  'var(--iris-accent-magenta)',
  'var(--iris-accent-amber)',
];

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  } catch {
    toast.error('Не удалось скопировать');
  }
};

const ContactCard: React.FC<{ contact: EmployeeContact }> = ({ contact }) => {
  const initials = (contact.full_name || contact.email)
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const color = AVATAR_COLORS[contact.user_id % AVATAR_COLORS.length];

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ borderColor: 'var(--iris-border-subtle)', backgroundColor: 'var(--iris-bg-surface)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {contact.full_name}
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {[contact.position, contact.department || ROLE_LABELS[contact.role] || contact.role]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 min-w-0"
            style={{ color: '#3B82F6' }}
          >
            <Mail size={14} className="flex-shrink-0" />
            <span className="truncate">{contact.email}</span>
          </a>
          <button
            onClick={() => copyText(contact.email)}
            className="p-1 rounded transition-colors flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            title="Скопировать email"
          >
            <Copy size={12} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
              className="flex items-center gap-2"
              style={{ color: '#3B82F6' }}
            >
              <Phone size={14} />
              {contact.phone}
            </a>
          ) : (
            <span className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Phone size={14} />
              Телефон не указан
            </span>
          )}
          {contact.phone && (
            <button
              onClick={() => copyText(contact.phone!)}
              className="p-1 rounded transition-colors flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}
              title="Скопировать телефон"
            >
              <Copy size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<EmployeeContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getEmployeeDirectory()
      .then(setContacts)
      .catch((err: any) =>
        setError(err.response?.data?.detail || 'Не удалось загрузить контакты')
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.full_name, c.email, c.phone, c.position, c.department, c.role]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [contacts, search]);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            Контакты
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Телефоны и почты сотрудников
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Users size={16} />
            <span>Сотрудников: {contacts.length}</span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{ borderColor: 'var(--iris-border-subtle)', backgroundColor: 'var(--iris-bg-app)' }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, отделу, почте…"
              className="bg-transparent text-sm outline-none w-56"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ borderColor: 'var(--error)', backgroundColor: 'var(--error-bg, #fef2f2)', color: 'var(--error)' }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Загрузка контактов…</span>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
          {search ? 'Никого не найдено по этому запросу' : 'Контактов пока нет'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContactCard key={c.user_id} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
