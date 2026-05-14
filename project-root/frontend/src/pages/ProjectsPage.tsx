import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Award, Search, Plus, ArrowRight, Calendar, DollarSign,
  Building2, Clock, AlertCircle, CheckCircle2, XCircle, Edit3, Trash2,
  ChevronDown, X, Save, BarChart3, Users, FileText
} from 'lucide-react';

/* ── Types ── */
type TenderStatus = 'draft' | 'submitted' | 'review' | 'won' | 'lost' | 'cancelled';
type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';

interface SRMInfo {
  customerName: string;
  customerContact: string;
  contactPhone: string;
  contactEmail: string;
  procurementType: string;
  contractAmount: number;
  currency: string;
  submissionDate: string;
  openingDate: string;
  tenderNumber: string;
  notes: string;
  communicationHistory: { date: string; note: string }[];
}

interface Tender {
  id: string;
  title: string;
  projectName: string;
  status: TenderStatus;
  createdAt: string;
  srm?: SRMInfo;
}

interface Project {
  id: string;
  name: string;
  customer: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  team: string[];
  documentsCount: number;
  tenders: string[]; // tender IDs linked
}

/* ── Status configs ── */
const tenderStatusConfig: Record<TenderStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft:      { label: 'В разработке', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', icon: <Clock size={14} /> },
  submitted:  { label: 'Подан', color: '#D4AF37', bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.4)', icon: <ArrowRight size={14} /> },
  review:     { label: 'На рассмотрении', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', icon: <AlertCircle size={14} /> },
  won:        { label: 'Выигран', color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)', border: 'rgba(79,122,76,0.4)', icon: <Award size={14} /> },
  lost:       { label: 'Проигран', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.4)', icon: <XCircle size={14} /> },
  cancelled:  { label: 'Отменён', color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.4)', icon: <X size={14} /> },
};

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:     { label: 'Активен', color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)' },
  completed:  { label: 'Завершён', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  on_hold:    { label: 'На паузе', color: '#D4AF37', bg: 'rgba(212,175,55,0.15)' },
  cancelled:  { label: 'Отменён', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
};

const kanbanColumns: { status: TenderStatus; title: string }[] = [
  { status: 'draft', title: 'В разработке' },
  { status: 'submitted', title: 'Поданы' },
  { status: 'review', title: 'На рассмотрении' },
  { status: 'won', title: 'Выиграны' },
];

/* ── Mock data ── */
const projectsData: Project[] = [
  { id: 'p1', name: 'ЖК «Северный»', customer: 'ООО «СеверСтрой»', status: 'active', progress: 78, startDate: '2025-09-01', endDate: '2026-12-31', budget: 45000000, team: ['Иванов А.С.', 'Козлов Д.А.'], documentsCount: 247, tenders: ['t1'] },
  { id: 'p2', name: 'ТЦ «Меридиан»', customer: 'АО «Меридиан Девелопмент»', status: 'active', progress: 45, startDate: '2026-01-15', endDate: '2027-06-30', budget: 28000000, team: ['Иванов А.С.', 'Новикова И.П.'], documentsCount: 156, tenders: ['t2'] },
  { id: 'p3', name: 'Склад А-12', customer: 'ООО «ЛогистикПарк»', status: 'active', progress: 92, startDate: '2025-06-01', endDate: '2026-08-15', budget: 15000000, team: ['Петров В.К.', 'Сидорова Е.М.'], documentsCount: 89, tenders: ['t3'] },
  { id: 'p4', name: 'ТЭЦ-5', customer: 'ПАО «МосЭнерго»', status: 'active', progress: 61, startDate: '2026-02-01', endDate: '2027-02-28', budget: 120000000, team: ['Сидорова Е.М.', 'Новикова И.П.'], documentsCount: 312, tenders: ['t4'] },
  { id: 'p5', name: 'Офис «Гамма»', customer: 'ООО «Гамма Инвест»', status: 'on_hold', progress: 23, startDate: '2025-11-01', endDate: '2026-10-31', budget: 35000000, team: ['Козлов Д.А.'], documentsCount: 45, tenders: ['t5'] },
];

const tendersData: Tender[] = [
  { id: 't1', title: 'ЖК «Северный» — КЖ', projectName: 'ЖК «Северный»', status: 'draft', createdAt: '2026-05-01', srm: { customerName: 'ООО «СеверСтрой»', customerContact: 'Иванов П.С.', contactPhone: '+7 (495) 123-45-67', contactEmail: 'tender@severstroy.ru', procurementType: 'Открытый конкурс', contractAmount: 45000000, currency: '₽', submissionDate: '', openingDate: '2026-06-15', tenderNumber: 'Т-2026-0847', notes: 'Требуется согласование КЖ + АР', communicationHistory: [{ date: '2026-05-01', note: 'Получены исходные данные' }, { date: '2026-05-05', note: 'Уточнение по геологии' }] } },
  { id: 't2', title: 'ТЦ «Меридиан» — ОВиК', projectName: 'ТЦ «Меридиан»', status: 'submitted', createdAt: '2026-04-20', srm: { customerName: 'АО «Меридиан Девелопмент»', customerContact: 'Петрова А.В.', contactPhone: '+7 (812) 987-65-43', contactEmail: 'procurement@meridian.ru', procurementType: 'Запрос котировок', contractAmount: 28000000, currency: '₽', submissionDate: '2026-05-08', openingDate: '2026-05-20', tenderNumber: 'Q-2026-1123', notes: 'Подана полная документация', communicationHistory: [{ date: '2026-04-20', note: 'Запрос на участие' }, { date: '2026-05-08', note: 'Документы поданы' }] } },
  { id: 't3', title: 'Склад А-12 — ЭОМ', projectName: 'Склад А-12', status: 'review', createdAt: '2026-04-10', srm: { customerName: 'ООО «ЛогистикПарк»', customerContact: 'Сидоров Д.М.', contactPhone: '+7 (495) 555-12-34', contactEmail: 'tenders@logpark.ru', procurementType: 'Аукцион', contractAmount: 15000000, currency: '₽', submissionDate: '2026-04-25', openingDate: '2026-05-10', tenderNumber: 'A-2026-0056', notes: 'Ожидаем протокол', communicationHistory: [{ date: '2026-04-10', note: 'Получен пригласительный' }, { date: '2026-04-25', note: 'Заявка подана' }, { date: '2026-05-05', note: 'Запрос разъяснений от заказчика' }] } },
  { id: 't4', title: 'ТЭЦ-5 — КР', projectName: 'ТЭЦ-5', status: 'won', createdAt: '2026-03-15', srm: { customerName: 'ПАО «МосЭнерго»', customerContact: 'Козлова Е.П.', contactPhone: '+7 (495) 777-88-99', contactEmail: 'purchase@mosenergo.ru', procurementType: 'Открытый конкурс', contractAmount: 120000000, currency: '₽', submissionDate: '2026-04-01', openingDate: '2026-04-20', tenderNumber: 'Т-2026-0091', notes: 'Победитель! Создать проект в производство', communicationHistory: [{ date: '2026-03-15', note: 'Публикация тендера' }, { date: '2026-04-01', note: 'Подготовка заявки' }, { date: '2026-04-20', note: 'Победа в конкурсе' }] } },
  { id: 't5', title: 'Офис «Гамма» — АР', projectName: 'Офис «Гамма»', status: 'lost', createdAt: '2026-02-10', srm: { customerName: 'ООО «Гамма Инвест»', customerContact: 'Новиков С.А.', contactPhone: '+7 (495) 333-44-55', contactEmail: 'zakupki@gamma.ru', procurementType: 'Закрытый конкурс', contractAmount: 35000000, currency: '₽', submissionDate: '2026-03-01', openingDate: '2026-03-20', tenderNumber: 'Z-2026-0034', notes: 'Проигран по цене', communicationHistory: [{ date: '2026-02-10', note: 'Приглашение на закрытый конкурс' }, { date: '2026-03-20', note: 'Результат — не победитель' }] } },
];

/* ── Helpers ── */
function TenderStatusBadge({ status }: { status: TenderStatus }) {
  const cfg = tenderStatusConfig[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = projectStatusConfig[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

/* ── SRM Modal ── */
function SRMModal({ tender, onClose, onSave }: { tender: Tender; onClose: () => void; onSave: (t: Tender) => void }) {
  const [form, setForm] = useState<SRMInfo>(tender.srm || {
    customerName: '', customerContact: '', contactPhone: '', contactEmail: '',
    procurementType: 'Открытый конкурс', contractAmount: 0, currency: '₽',
    submissionDate: '', openingDate: '', tenderNumber: '', notes: '',
    communicationHistory: [],
  });
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (!newNote.trim()) return;
    setForm(prev => ({ ...prev, communicationHistory: [...prev.communicationHistory, { date: new Date().toISOString().split('T')[0], note: newNote }] }));
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', boxShadow: 'var(--iris-shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>SRM: {tender.title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Заказчик</label><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Контактное лицо</label><input value={form.customerContact} onChange={e => setForm({ ...form, customerContact: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Телефон</label><input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label><input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Тип закупки</label>
            <select value={form.procurementType} onChange={e => setForm({ ...form, procurementType: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
              <option>Открытый конкурс</option><option>Закрытый конкурс</option><option>Запрос котировок</option><option>Аукцион</option><option>Прямой договор</option>
            </select>
          </div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Сумма контракта</label>
            <div className="flex gap-2">
              <input type="number" value={form.contractAmount} onChange={e => setForm({ ...form, contractAmount: Number(e.target.value) })} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-20 rounded-lg px-2 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}><option>₽</option><option>$</option><option>€</option></select>
            </div>
          </div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Дата подачи</label><input type="date" value={form.submissionDate} onChange={e => setForm({ ...form, submissionDate: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Дата раскрытия</label><input type="date" value={form.openingDate} onChange={e => setForm({ ...form, openingDate: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div className="sm:col-span-2"><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Номер тендера</label><input value={form.tenderNumber} onChange={e => setForm({ ...form, tenderNumber: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
          <div className="sm:col-span-2"><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Примечания</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
        </div>
        <div className="border-t pt-4" style={{ borderColor: 'var(--border-divider)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>История взаимодействия</h3>
          <div className="space-y-2 mb-3">
            {form.communicationHistory.map((h, i) => (
              <div key={i} className="flex gap-3 text-sm p-2 rounded-lg" style={{ background: 'var(--iris-bg-hover)' }}>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{h.date}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{h.note}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Новая запись..." className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
            <button onClick={addNote} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#6B5B95' }}>Добавить</button>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>Отмена</button>
          <button onClick={() => { onSave({ ...tender, srm: form }); onClose(); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #6B5B95 0%, #5A4D80 100%)', boxShadow: '0 4px 16px rgba(107,91,149,0.35)' }}><Save size={16} /> Сохранить</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'tenders'>('projects');
  const [search, setSearch] = useState('');
  const [tenders, setTenders] = useState<Tender[]>(tendersData);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [showCreateTender, setShowCreateTender] = useState(false);

  const filteredProjects = projectsData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.customer.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTenders = tenders.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.projectName.toLowerCase().includes(search.toLowerCase())
  );

  const saveTender = (updated: Tender) => {
    setTenders(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const moveStatus = (id: string, newStatus: TenderStatus) => {
    setTenders(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTender = (id: string) => {
    if (confirm('Удалить тендер?')) setTenders(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Портфель заказов</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {activeTab === 'projects' ? 'Управление проектами и прогрессом' : 'Тендеры и SRM-информация'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={activeTab === 'projects' ? 'Поиск проекта...' : 'Поиск тендера...'} className="bg-transparent outline-none text-sm w-40 md:w-56" style={{ color: 'var(--text-primary)' }} />
          </div>
          {activeTab === 'tenders' && (
            <button onClick={() => setShowCreateTender(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #6B5B95 0%, #5A4D80 100%)', boxShadow: '0 4px 16px rgba(107,91,149,0.35)' }}>
              <Plus size={16} /> Новый тендер
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs: Projects / Tenders */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-divider)' }}>
        <button
          onClick={() => setActiveTab('projects')}
          className="relative px-4 py-2.5 text-sm font-medium transition-all"
          style={{
            color: activeTab === 'projects' ? '#6B5B95' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'projects' ? 'rgba(107, 91, 149, 0.15)' : 'transparent',
          }}
        >
          <span className="flex items-center gap-2">
            <FolderKanban size={16} /> Проекты
          </span>
          {activeTab === 'projects' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: '#6B5B95', boxShadow: '0 0 8px #6B5B95' }} />}
        </button>
        <button
          onClick={() => setActiveTab('tenders')}
          className="relative px-4 py-2.5 text-sm font-medium transition-all"
          style={{
            color: activeTab === 'tenders' ? '#6B5B95' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'tenders' ? 'rgba(107, 91, 149, 0.15)' : 'transparent',
          }}
        >
          <span className="flex items-center gap-2">
            <Award size={16} /> Тендеры
          </span>
          {activeTab === 'tenders' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: '#6B5B95', boxShadow: '0 0 8px #6B5B95' }} />}
        </button>
      </div>

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Активных', value: projectsData.filter(p => p.status === 'active').length, icon: <FolderKanban size={18} />, color: '#4F7A4C' },
              { label: 'На паузе', value: projectsData.filter(p => p.status === 'on_hold').length, icon: <Clock size={18} />, color: '#D4AF37' },
              { label: 'Завершено', value: projectsData.filter(p => p.status === 'completed').length, icon: <CheckCircle2 size={18} />, color: '#3B82F6' },
              { label: 'Общий бюджет', value: `${(projectsData.reduce((s, p) => s + p.budget, 0) / 1000000).toFixed(0)}M ₽`, icon: <DollarSign size={18} />, color: '#6B5B95' },
            ].map(s => (
              <div key={s.label} className="neon-purple p-4 flex items-center gap-3" style={{ background: 'var(--card-bg)' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <div key={project.id} className="neon-purple p-5 space-y-4" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{project.customer}</p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>Прогресс</span>
                    <span style={{ color: 'var(--text-primary)' }}>{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-elevated)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, background: project.progress >= 80 ? '#4F7A4C' : project.progress >= 50 ? '#D4AF37' : '#6B5B95' }} />
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-1.5"><Calendar size={12} /> {project.startDate}</div>
                  <div className="flex items-center gap-1.5"><DollarSign size={12} /> {(project.budget / 1000000).toFixed(1)}M ₽</div>
                  <div className="flex items-center gap-1.5"><Users size={12} /> {project.team.length} чел.</div>
                  <div className="flex items-center gap-1.5"><FileText size={12} /> {project.documentsCount} док.</div>
                </div>

                {/* Team */}
                <div className="flex flex-wrap gap-1.5">
                  {project.team.map((member, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-secondary)' }}>{member}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => navigate(`/documents?project=${project.id}`)} className="flex-1 text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#9B8EC7', borderColor: 'rgba(107,91,149,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,91,149,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>Документы</button>
                  <button onClick={() => navigate(`/workflow?project=${project.id}`)} className="flex-1 text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#9B8EC7', borderColor: 'rgba(107,91,149,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,91,149,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>Замечания</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TENDERS TAB ── */}
      {activeTab === 'tenders' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'В разработке', value: tenders.filter(t => t.status === 'draft').length, color: '#94A3B8' },
              { label: 'Поданы', value: tenders.filter(t => t.status === 'submitted').length, color: '#D4AF37' },
              { label: 'На рассмотрении', value: tenders.filter(t => t.status === 'review').length, color: '#3B82F6' },
              { label: 'Выиграны', value: tenders.filter(t => t.status === 'won').length, color: '#4F7A4C' },
            ].map(s => (
              <div key={s.label} className="neon-purple p-4 flex flex-col gap-1" style={{ background: 'var(--card-bg)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map(col => {
              const colTenders = filteredTenders.filter(t => t.status === col.status);
              return (
                <div key={col.status} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-semibold" style={{ color: tenderStatusConfig[col.status].color }}>{col.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: tenderStatusConfig[col.status].bg, color: tenderStatusConfig[col.status].color }}>{colTenders.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {colTenders.map(tender => (
                      <div key={tender.id} className="neon-purple p-4 space-y-3 transition-all hover:scale-[1.02]" style={{ background: 'var(--card-bg)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tender.title}</h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{tender.projectName}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingTender(tender)} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-secondary)' }} title="SRM"><Building2 size={14} /></button>
                            <button onClick={() => deleteTender(tender.id)} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-secondary)' }} title="Удалить"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <TenderStatusBadge status={tender.status} />
                        {tender.srm && (
                          <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <div className="flex items-center gap-1.5"><Building2 size={12} />{tender.srm.customerName}</div>
                            <div className="flex items-center gap-1.5"><DollarSign size={12} />{tender.srm.contractAmount.toLocaleString('ru-RU')} {tender.srm.currency}</div>
                            {tender.srm.openingDate && <div className="flex items-center gap-1.5"><Calendar size={12} />Раскрытие: {tender.srm.openingDate}</div>}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {tender.status === 'draft' && <button onClick={() => moveStatus(tender.id, 'submitted')} className="text-xs px-2 py-1 rounded border flex items-center gap-1" style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}><ArrowRight size={12} /> Подать</button>}
                          {tender.status === 'submitted' && <button onClick={() => moveStatus(tender.id, 'review')} className="text-xs px-2 py-1 rounded border flex items-center gap-1" style={{ color: '#3B82F6', borderColor: 'rgba(59,130,246,0.3)' }}><Clock size={12} /> На рассмотрение</button>}
                          {tender.status === 'review' && (
                            <>
                              <button onClick={() => moveStatus(tender.id, 'won')} className="text-xs px-2 py-1 rounded border flex items-center gap-1" style={{ color: '#4F7A4C', borderColor: 'rgba(79,122,76,0.3)' }}><Award size={12} /> Выиграть</button>
                              <button onClick={() => moveStatus(tender.id, 'lost')} className="text-xs px-2 py-1 rounded border flex items-center gap-1" style={{ color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }}><XCircle size={12} /> Проиграть</button>
                            </>
                          )}
                          {tender.status === 'won' && <button onClick={() => navigate(`/projects?create=${tender.projectName}`)} className="text-xs px-2 py-1 rounded border flex items-center gap-1" style={{ color: '#4F7A4C', borderColor: 'rgba(79,122,76,0.3)' }}><CheckCircle2 size={12} /> Создать проект</button>}
                        </div>
                        <button onClick={() => setEditingTender(tender)} className="w-full text-xs py-1.5 rounded-lg border flex items-center justify-center gap-1.5 transition-colors" style={{ color: '#9B8EC7', borderColor: 'rgba(107,91,149,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,91,149,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}><Edit3 size={12} />{tender.srm ? 'Изменить SRM' : 'Заполнить SRM'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lost / Cancelled */}
          {(filteredTenders.some(t => t.status === 'lost' || t.status === 'cancelled')) && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Архив: проигранные и отменённые</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenders.filter(t => t.status === 'lost' || t.status === 'cancelled').map(tender => (
                  <div key={tender.id} className="neon-gray p-4 space-y-2 opacity-70" style={{ background: 'var(--card-bg)' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tender.title}</h3>
                      <TenderStatusBadge status={tender.status} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tender.projectName}</p>
                    {tender.srm && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tender.srm.customerName} · {tender.srm.contractAmount.toLocaleString('ru-RU')} {tender.srm.currency}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SRM Modal */}
      {editingTender && <SRMModal tender={editingTender} onClose={() => setEditingTender(null)} onSave={saveTender} />}

      {/* Create Tender Modal */}
      {showCreateTender && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', boxShadow: 'var(--iris-shadow-lg)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Новый тендер</h2>
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Название тендера</label><input id="new-tender-title" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Проект</label><input id="new-tender-project" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateTender(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>Отмена</button>
              <button onClick={() => { const t = (document.getElementById('new-tender-title') as HTMLInputElement)?.value; const p = (document.getElementById('new-tender-project') as HTMLInputElement)?.value; if (t && p) { setTenders(prev => [{ id: `t${Date.now()}`, title: t, projectName: p, status: 'draft', createdAt: new Date().toISOString().split('T')[0] }, ...prev]); } setShowCreateTender(false); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #6B5B95 0%, #5A4D80 100%)', boxShadow: '0 4px 16px rgba(107,91,149,0.35)' }}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}