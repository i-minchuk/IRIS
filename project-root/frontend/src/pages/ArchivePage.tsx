import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive, Search, Filter, Eye, Download, Star, Clock, FolderKanban,
  FileText, Hash, Building2, Users, Calendar, ChevronDown, Bookmark,
  HardHat, Ruler, Layers, X
} from 'lucide-react';

/* ── Types ── */
type ArchiveCategory = 'projects' | 'templates' | 'solutions' | 'favorites';
type ProjectType = 'ЖК' | 'ТЦ' | 'Склад' | 'ТЭЦ' | 'Офис' | 'Прочее';

interface ArchivedProject {
  id: string;
  name: string;
  type: ProjectType;
  year: number;
  customer: string;
  area: number;
  floors: number;
  team: string[];
  documentsCount: number;
  tags: string[];
  thumbnail: string; // placeholder color
  isFavorite: boolean;
  lastViewed?: string;
  notes: string;
}

interface TemplateDoc {
  id: string;
  name: string;
  category: string;
  format: string;
  downloads: number;
  isFavorite: boolean;
}

interface TypicalSolution {
  id: string;
  name: string;
  type: string;
  projectsUsed: string[];
  preview: string;
}

/* ── Mock data ── */
const archivedProjects: ArchivedProject[] = [
  {
    id: 'a1', name: 'ЖК «Северный»', type: 'ЖК', year: 2025, customer: 'ООО «СеверСтрой»',
    area: 45000, floors: 25, team: ['Иванов А.С.', 'Петров В.К.', 'Козлов Д.А.'],
    documentsCount: 247, tags: ['монолит', '25 этажей', 'сваи Ø600', 'сейсмика 9 баллов', 'подземный паркинг'],
    thumbnail: '#4F7A4C', isFavorite: true, lastViewed: '2 дня назад',
    notes: 'Сложный грунт, использовали буронабивные сваи. Архитектура — стекло + фиброцемент.',
  },
  {
    id: 'a2', name: 'ТЦ «Меридиан»', type: 'ТЦ', year: 2024, customer: 'АО «Меридиан Девелопмент»',
    area: 28000, floors: 5, team: ['Иванов А.С.', 'Сидорова Е.М.', 'Новикова И.П.'],
    documentsCount: 156, tags: ['стальные колонны', 'атриум', 'вентфасад', 'подземный паркинг'],
    thumbnail: '#6B5B95', isFavorite: false, lastViewed: '1 неделю назад',
    notes: 'Атриум 12×24м, стеклянная кровля. Вентфасад — керамогранит.',
  },
  {
    id: 'a3', name: 'Склад А-12', type: 'Склад', year: 2024, customer: 'ООО «ЛогистикПарк»',
    area: 15000, floors: 1, team: ['Петров В.К.', 'Сидорова Е.М.'],
    documentsCount: 89, tags: ['беспролётный', 'фермы 36м', 'плоская кровля', 'бетон B25'],
    thumbnail: '#D4AF37', isFavorite: true,
    notes: 'Беспролётное пространство 36м, фермы из параллельных балок.',
  },
  {
    id: 'a4', name: 'ТЭЦ-5', type: 'ТЭЦ', year: 2023, customer: 'ПАО «МосЭнерго»',
    area: 120000, floors: 3, team: ['Сидорова Е.М.', 'Новикова И.П.', 'Козлов Д.А.'],
    documentsCount: 312, tags: ['промышленный', 'котельная', 'дымовая труба 80м', 'фундамент плита'],
    thumbnail: '#3B82F6', isFavorite: false,
    notes: 'Дымовая труба 80м на монолитном стакане. Фундамент — плита 2.5м.',
  },
  {
    id: 'a5', name: 'Офис «Гамма»', type: 'Офис', year: 2023, customer: 'ООО «Гамма Инвест»',
    area: 35000, floors: 12, team: ['Козлов Д.А.', 'Иванов А.С.'],
    documentsCount: 134, tags: ['12 этажей', 'каркас', 'вентфасад', 'подземный паркинг'],
    thumbnail: '#94A3B8', isFavorite: false,
    notes: 'Класс B+, вентилируемый фасад из композита.',
  },
  {
    id: 'a6', name: 'ЖК «Южный парк»', type: 'ЖК', year: 2022, customer: 'ООО «ЮжСтрой»',
    area: 62000, floors: 18, team: ['Петров В.К.', 'Сидорова Е.М.'],
    documentsCount: 198, tags: ['монолит', '18 этажей', 'сваи Ø800', 'бассейн на кровле'],
    thumbnail: '#4F7A4C', isFavorite: false,
    notes: 'Бассейн на кровле — гидроизоляция ПВХ-мембрана.',
  },
];

const templates: TemplateDoc[] = [
  { id: 't1', name: 'Типовой узел примыкания балки', category: 'КЖ', format: 'dwg', downloads: 45, isFavorite: true },
  { id: 't2', name: 'Шаблон спецификации арматуры', category: 'КЖ', format: 'xlsx', downloads: 32, isFavorite: false },
  { id: 't3', name: 'Типовая схема вентиляции подвала', category: 'ОВиК', format: 'dwg', downloads: 28, isFavorite: true },
  { id: 't4', name: 'Шаблон однолинейной схемы', category: 'ЭОМ', format: 'dwg', downloads: 21, isFavorite: false },
  { id: 't5', name: 'Типовой план эвакуации', category: 'АР', format: 'pdf', downloads: 67, isFavorite: true },
  { id: 't6', name: 'Шаблон ведомости рабочей документации', category: 'Тендер', format: 'docx', downloads: 89, isFavorite: true },
];

const typicalSolutions: TypicalSolution[] = [
  { id: 's1', name: 'Узел балка-колонна (монолит)', type: 'КЖ', projectsUsed: ['ЖК «Северный»', 'ЖК «Южный парк»'], preview: 'Схема арматурного каркаса узла' },
  { id: 's2', name: 'Фундамент плита под ТЭЦ', type: 'КР', projectsUsed: ['ТЭЦ-5'], preview: 'Плита 2.5м с арматурой Ø32' },
  { id: 's3', name: 'Вентилируемый фасад (керамогранит)', type: 'АР', projectsUsed: ['ТЦ «Меридиан»'], preview: 'Узел крепления подсистемы' },
  { id: 's4', name: 'Беспролётные фермы 36м', type: 'КМ', projectsUsed: ['Склад А-12'], preview: 'Схема узла опирания фермы' },
];

/* ── Helpers ── */
const typeColors: Record<ProjectType, string> = {
  'ЖК': '#4F7A4C',
  'ТЦ': '#6B5B95',
  'Склад': '#D4AF37',
  'ТЭЦ': '#3B82F6',
  'Офис': '#94A3B8',
  'Прочее': '#64748B',
};

/* ── Main Page ── */
export default function ArchivePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ArchiveCategory>('projects');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const years = Array.from(new Set(archivedProjects.map(p => p.year))).sort((a, b) => b - a);

  const filteredProjects = archivedProjects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      p.customer.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || p.type === filterType;
    const matchYear = filterYear === 'all' || p.year === filterYear;
    const matchFav = !favoritesOnly || p.isFavorite;
    return matchSearch && matchType && matchYear && matchFav;
  });

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSolutions = typicalSolutions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Архив</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Завершённые проекты, типовые решения и шаблоны</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по проекту, тегу, заказчику..."
              className="bg-transparent outline-none text-sm w-48 md:w-72"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className="px-3 py-2 rounded-lg text-sm border flex items-center gap-1.5 transition-colors"
            style={{ color: favoritesOnly ? '#D4AF37' : 'var(--text-secondary)', borderColor: favoritesOnly ? 'rgba(212,175,55,0.4)' : 'var(--border-default)', background: favoritesOnly ? 'rgba(212,175,55,0.1)' : 'transparent' }}
          >
            <Star size={14} /> {favoritesOnly ? 'Все' : 'Избранное'}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-divider)' }}>
        {[
          { key: 'projects', label: 'Проекты', icon: <FolderKanban size={16} /> },
          { key: 'templates', label: 'Шаблоны', icon: <FileText size={16} /> },
          { key: 'solutions', label: 'Типовые решения', icon: <HardHat size={16} /> },
          { key: 'favorites', label: 'Избранное', icon: <Star size={16} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ArchiveCategory)}
            className="relative px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
            style={{
              color: activeTab === tab.key ? '#6B7280' : 'var(--text-secondary)',
              backgroundColor: activeTab === tab.key ? 'rgba(107,114,128,0.15)' : 'transparent',
            }}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: '#6B7280', boxShadow: '0 0 8px #6B7280' }} />}
          </button>
        ))}
      </div>

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterType} onChange={e => setFilterType(e.target.value as ProjectType | 'all')} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
              <option value="all">Все типы объектов</option>
              {Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value) || 'all')} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
              <option value="all">Все годы</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Найдено: {filteredProjects.length}</span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => {
              const isExpanded = expandedProject === project.id;
              return (
                <div key={project.id} className="neon-gray p-5 space-y-3 transition-all hover:scale-[1.01]" style={{ background: 'var(--card-bg)' }}>
                  {/* Thumbnail */}
                  <div className="h-24 rounded-xl flex items-center justify-center relative" style={{ background: `${project.thumbnail}20` }}>
                    <Building2 size={40} style={{ color: project.thumbnail }} />
                    <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${project.thumbnail}30`, color: project.thumbnail }}>{project.type}</span>
                    {project.isFavorite && <Star size={14} className="absolute top-2 left-2" style={{ color: '#D4AF37' }} />}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{project.customer}</p>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1"><Calendar size={10} /> {project.year}</div>
                    <div className="flex items-center gap-1"><Ruler size={10} /> {project.area.toLocaleString('ru-RU')} м²</div>
                    <div className="flex items-center gap-1"><Layers size={10} /> {project.floors} эт.</div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-divider)', background: 'var(--iris-bg-hover)' }}>{tag}</span>
                    ))}
                  </div>

                  {/* Team */}
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Users size={10} /> {project.team.join(', ')}
                  </div>

                  {/* Notes preview */}
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.notes}</p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setExpandedProject(isExpanded ? null : project.id)} className="flex-1 text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#6B7280', borderColor: 'rgba(107,114,128,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,114,128,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      {isExpanded ? 'Свернуть' : 'Подробнее'}
                    </button>
                    <button onClick={() => navigate(`/documents?project=${project.name}`)} className="flex-1 text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#9B8EC7', borderColor: 'rgba(107,91,149,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,91,149,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <FileText size={12} className="inline mr-1" /> Документы
                    </button>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border-divider)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Документов:</strong> {project.documentsCount}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Опыт:</strong> {project.notes}
                      </div>
                      {project.lastViewed && (
                        <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={10} /> Просмотрено: {project.lastViewed}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button className="flex-1 text-xs py-1.5 rounded-lg text-white text-center" style={{ background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' }}>
                          <Download size={12} className="inline mr-1" /> Пакет документов
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="neon-gray p-4" style={{ background: 'var(--card-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Bookmark size={14} className="inline mr-1" style={{ color: '#D4AF37' }} />
              Шаблоны для тендерного отдела и инженеров. Часто используемые документы для быстрого старта новых проектов.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(t => (
              <div key={t.id} className="neon-gray p-4 space-y-3" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} style={{ color: '#6B7280' }} />
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.category} · {t.format.toUpperCase()}</p>
                    </div>
                  </div>
                  <button className="p-1 rounded transition-colors" style={{ color: t.isFavorite ? '#D4AF37' : 'var(--text-muted)' }}>
                    <Star size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Download size={10} /> {t.downloads} скачиваний</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs py-1.5 rounded-lg text-white text-center" style={{ background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' }}>
                    <Eye size={12} className="inline mr-1" /> Просмотр
                  </button>
                  <button className="flex-1 text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#6B7280', borderColor: 'rgba(107,114,128,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,114,128,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <Download size={12} className="inline mr-1" /> Скачать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TYPICAL SOLUTIONS TAB ── */}
      {activeTab === 'solutions' && (
        <div className="space-y-6">
          <div className="neon-gray p-4" style={{ background: 'var(--card-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <HardHat size={14} className="inline mr-1" style={{ color: '#4F7A4C' }} />
              База типовых решений. Узлы, детали и конструкции, которые уже применялись на проектах. Не чертите заново — берите готовое.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSolutions.map(s => (
              <div key={s.id} className="neon-gray p-5 space-y-3" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2">
                  <Layers size={18} style={{ color: '#6B5B95' }} />
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded border" style={{ color: '#6B5B95', borderColor: 'rgba(107,91,149,0.3)', background: 'rgba(107,91,149,0.08)' }}>{s.type}</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.preview}</p>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong>Применено в:</strong> {s.projectsUsed.join(', ')}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs py-1.5 rounded-lg text-white text-center" style={{ background: 'linear-gradient(135deg, #6B5B95 0%, #5A4D80 100%)' }}>
                    <Eye size={12} className="inline mr-1" /> Просмотр
                  </button>
                  <button className="flex-1 text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#6B7280', borderColor: 'rgba(107,114,128,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,114,128,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <Download size={12} className="inline mr-1" /> Скачать DWG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAVORITES TAB ── */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...archivedProjects.filter(p => p.isFavorite), ...templates.filter(t => t.isFavorite)].map((item: any) => (
              <div key={item.id || item.name} className="neon-gray p-4 space-y-3" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2">
                  <Star size={16} style={{ color: '#D4AF37' }} />
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                </div>
                {'type' in item && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.type} · {item.year}</p>}
                {'category' in item && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.category} · {item.format.toUpperCase()}</p>}
                <button className="w-full text-xs py-1.5 rounded-lg border text-center transition-colors" style={{ color: '#6B7280', borderColor: 'rgba(107,114,128,0.3)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,114,128,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  Открыть
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}