import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  FileCheck,
  Upload,
  Loader2,
  Trash2,
  Plus,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchStandards,
  uploadStandard,
  deleteStandard,
  createStandard,
  type Standard,
  type StandardRequirement,
} from './standardsApi';

const typeLabels: Record<string, string> = {
  gost: 'ГОСТ/Стандарт',
  material: 'Материал',
  dimension: 'Размер',
  pressure: 'Давление',
  temperature: 'Температура',
  other: 'Другое',
};

interface StandardCardProps {
  standard: Standard;
  onDelete: (id: number) => void;
}

function StandardCard({ standard, onDelete }: StandardCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* role=button вместо <button>, чтобы не нарушать HTML (внутри — кнопка «Удалить») */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileCheck size={18} style={{ color: '#14B8A6' }} />
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {standard.name}
            </div>
            {standard.code && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {standard.code}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-muted)' }}
          >
            {standard.requirements.length} треб.
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(standard.id);
            }}
            className="p-1 rounded hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4">
          {standard.description && (
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              {standard.description}
            </p>
          )}
          {standard.file_name && (
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Файл: {standard.file_name}
            </p>
          )}
          {standard.requirements.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Требования не извлечены
            </p>
          ) : (
            <div className="space-y-2">
              {standard.requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border p-3"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(20, 184, 166, 0.12)', color: '#14B8A6' }}
                    >
                      {typeLabels[req.type] || req.type}
                    </span>
                    {req.section && (
                      <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {req.section}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {req.value}
                  </div>
                  {req.description && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {req.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StandardsPanel() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manualForm, setManualForm] = useState<{
    name: string;
    code: string;
    description: string;
    requirementsText: string;
  }>({ name: '', code: '', description: '', requirementsText: '' });

  const loadStandards = async () => {
    setLoading(true);
    try {
      const data = await fetchStandards();
      setStandards(data);
    } catch (err) {
      console.error('Failed to load standards:', err);
      toast.error('Не удалось загрузить нормативы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandards();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return standards;
    const q = searchQuery.toLowerCase();
    return standards.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code?.toLowerCase().includes(q) ?? false) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [standards, searchQuery]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.docx') && !lower.endsWith('.pdf')) {
      toast.error('Поддерживаются только файлы .docx и .pdf');
      return;
    }
    setUploading(true);
    try {
      await uploadStandard(file);
      toast.success(`Норматив «${file.name}» загружен и обработан`);
      await loadStandards();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка загрузки норматива');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStandard(id);
      setStandards((prev) => prev.filter((s) => s.id !== id));
      toast.success('Норматив удалён');
    } catch (err) {
      toast.error('Не удалось удалить норматив');
    }
  };

  const handleManualCreate = async () => {
    if (!manualForm.name.trim()) {
      toast.error('Укажите название норматива');
      return;
    }
    const requirements: StandardRequirement[] = manualForm.requirementsText
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({ type: 'other', value: line.trim() }));
    try {
      await createStandard({
        name: manualForm.name,
        code: manualForm.code || undefined,
        description: manualForm.description || undefined,
        requirements,
        source: 'manual',
      });
      toast.success('Норматив создан');
      setManualForm({ name: '', code: '', description: '', requirementsText: '' });
      setShowManual(false);
      await loadStandards();
    } catch (err) {
      toast.error('Не удалось создать норматив');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg max-w-md w-full"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или коду..."
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs px-2 py-0.5 rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Очистить
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            style={{ background: '#14B8A6', color: '#FFFFFF' }}
            onMouseEnter={(e) => {
              if (!uploading) e.currentTarget.style.backgroundColor = '#0D9488';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#14B8A6';
            }}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Загрузка…' : 'Загрузить норматив'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => setShowManual((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: 'var(--iris-bg-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--iris-border-subtle)',
            }}
          >
            <Plus size={16} /> Добавить вручную
          </button>
        </div>
      </div>

      {/* Manual form */}
      {showManual && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Новый норматив
            </h3>
            <button onClick={() => setShowManual(false)} style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Название норматива"
            value={manualForm.name}
            onChange={(e) => setManualForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
          <input
            type="text"
            placeholder="Код (например, ГОСТ 3262-75)"
            value={manualForm.code}
            onChange={(e) => setManualForm((p) => ({ ...p, code: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
          <textarea
            placeholder="Описание"
            value={manualForm.description}
            onChange={(e) => setManualForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
          <textarea
            placeholder="Требования (каждое с новой строки)"
            value={manualForm.requirementsText}
            onChange={(e) => setManualForm((p) => ({ ...p, requirementsText: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowManual(false)}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              Отмена
            </button>
            <button
              onClick={handleManualCreate}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ background: '#14B8A6', color: '#FFFFFF' }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <BookOpen size={14} />
          <span>{standards.length} нормативов</span>
        </div>
        <div className="flex items-center gap-1">
          <FileCheck size={14} />
          <span>
            {standards.reduce((sum, s) => sum + s.requirements.length, 0)} требований
          </span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={20} className="animate-spin mr-2" /> Загрузка нормативов…
        </div>
      ) : standards.length === 0 ? (
        <div
          className="text-center py-12 text-sm rounded-xl"
          style={{
            color: 'var(--text-muted)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-default)',
          }}
        >
          Нормативы не загружены. Загрузите файл .docx/.pdf с нормативом, чтобы AI извлёк требования.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          Ничего не найдено по запросу «{searchQuery}»
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((standard) => (
            <StandardCard key={standard.id} standard={standard} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
