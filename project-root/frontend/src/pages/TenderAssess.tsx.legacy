import { useState } from 'react';
import { assessTender } from '../api/tender';
import type { TenderResult, TenderDoc } from '../types';
import { ClipboardCheck, AlertTriangle, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';

const DECISION_CONFIG = {
  GO: { icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-500' },
  RISKY: { icon: AlertTriangle, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-500' },
  NO_GO: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-500' },
};

const MOCK_RESULT: TenderResult = {
  tender: { name: 'Модернизация ГРС-5', customer: 'Газпром', deadline: '2026-05-25', calendar_days: 61, work_days: 43 },
  requirements: { total_documents: 35, total_hours: 560, engineers_needed: 3, by_type: [
    { doc_type: 'КМ', count: 15, hours: 240 }, { doc_type: 'ЭС', count: 10, hours: 180 }, { doc_type: 'ТМ', count: 10, hours: 140 },
  ]},
  team_capacity: { total_engineers: 5, available_engineers: 2, capacity_hours: 1720, current_load_hours: 420, free_hours: 1300, utilization_pct: 24.4 },
  assessment: { decision: 'RISKY', decision_label: 'Умеренный риск', confidence: 'medium', feasibility_pct: 72, risks: [
    { level: 'medium', text: 'Не хватает инженеров: нужно 3, доступно 2' },
    { level: 'medium', text: 'Команда загружена более чем на 70%' },
  ]},
};

export default function TenderAssess() {
  const [form, setForm] = useState({
    tender_name: '',
    customer: '',
    deadline_date: '',
  });
  const [docs, setDocs] = useState<TenderDoc[]>([{ doc_type: 'КМ', count: 10, hours_per_doc: 16 }]);
  const [result, setResult] = useState<TenderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const addDoc = () => setDocs([...docs, { doc_type: '', count: 1, hours_per_doc: 8 }]);
  const removeDoc = (i: number) => setDocs(docs.filter((_, idx) => idx !== i));
  const updateDoc = (i: number, field: keyof TenderDoc, value: string | number) => {
    const updated = [...docs];
    (updated[i] as TenderDoc)[field] = value;
    setDocs(updated);
  };

  const handleAssess = async () => {
    if (!form.tender_name || !form.deadline_date) return;
    setLoading(true);
    try {
      const res = await assessTender({ ...form, documents: docs });
      setResult(res);
    } catch {
      setResult(MOCK_RESULT);
      setShowDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setResult(MOCK_RESULT);
    setShowDemo(true);
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <ClipboardCheck size={28} className="text-primary-600" /> Оценка тендера (Go / No-Go)
      </h1>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">Параметры тендера</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название тендера</label>
            <input value={form.tender_name} onChange={e => setForm({...form, tender_name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg" placeholder="Модернизация ГРС-5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заказчик</label>
            <input value={form.customer} onChange={e => setForm({...form, customer: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg" placeholder="Газпром" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
            <input type="date" value={form.deadline_date} onChange={e => setForm({...form, deadline_date: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <h3 className="font-medium text-sm text-gray-700 mb-2">Объём документации</h3>
        <div className="space-y-2 mb-4">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <input value={d.doc_type} onChange={e => updateDoc(i, 'doc_type', e.target.value)}
                className="px-3 py-2 border rounded-lg w-32" placeholder="Тип (КМ, ЭС...)" />
              <div className="flex items-center gap-1">
                <input type="number" value={d.count} onChange={e => updateDoc(i, 'count', Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg w-20 text-center" min={1} />
                <span className="text-sm text-gray-500">шт.</span>
              </div>
              <div className="flex items-center gap-1">
                <input type="number" value={d.hours_per_doc} onChange={e => updateDoc(i, 'hours_per_doc', Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg w-20 text-center" min={1} />
                <span className="text-sm text-gray-500">ч/шт</span>
              </div>
              <span className="text-sm text-gray-400 w-20">= {d.count * d.hours_per_doc} ч</span>
              {docs.length > 1 && (
                <button onClick={() => removeDoc(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addDoc} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium mb-4">
          <Plus size={16} /> Добавить тип документации
        </button>

        <div className="flex gap-3">
          <button onClick={handleAssess} disabled={loading}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Анализ...' : 'Оценить'}
          </button>
          <button onClick={handleDemo}
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 text-sm">
            Демо-пример
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {showDemo && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">Демо-данные. Для реального анализа запустите бэкенд.</div>
          )}

          {/* Decision card */}
          {(() => {
            const cfg = DECISION_CONFIG[result.assessment.decision];
            const Icon = cfg.icon;
            return (
              <div className={`rounded-xl p-6 border-l-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-4">
                  <Icon size={48} className={cfg.color} />
                  <div>
                    <div className={`text-2xl font-bold ${cfg.color}`}>{result.assessment.decision_label}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Вероятность выполнения: <span className="font-semibold">{result.assessment.feasibility_pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-500 mb-3">Сроки</h3>
              <div className="text-2xl font-bold">{result.tender.calendar_days} дней</div>
              <div className="text-sm text-gray-500">{result.tender.work_days} рабочих дней</div>
              <div className="text-sm text-gray-400 mt-1">до {result.tender.deadline}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-500 mb-3">Требуемый объём</h3>
              <div className="text-2xl font-bold">{result.requirements.total_hours} ч</div>
              <div className="text-sm text-gray-500">{result.requirements.total_documents} документов</div>
              <div className="text-sm text-gray-400 mt-1">нужно {result.requirements.engineers_needed} инженеров</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-500 mb-3">Ресурсы команды</h3>
              <div className="text-2xl font-bold text-green-600">{result.team_capacity.free_hours} ч</div>
              <div className="text-sm text-gray-500">свободных из {result.team_capacity.capacity_hours} ч</div>
              <div className="text-sm text-gray-400 mt-1">{result.team_capacity.available_engineers} из {result.team_capacity.total_engineers} доступны</div>
            </div>
          </div>

          {/* Risks */}
          {result.assessment.risks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-3">Выявленные риски</h3>
              <div className="space-y-2">
                {result.assessment.risks.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2 px-4 py-2 rounded-lg ${r.level === 'high' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    <AlertTriangle size={16} className={r.level === 'high' ? 'text-red-500 mt-0.5' : 'text-yellow-500 mt-0.5'} />
                    <span className={`text-sm ${r.level === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-3">Объём по типам документации</h3>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Тип</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Количество</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Часы</th>
                </tr>
              </thead>
              <tbody>
                {result.requirements.by_type.map(t => (
                  <tr key={t.doc_type} className="border-t">
                    <td className="px-4 py-2 font-medium">{t.doc_type}</td>
                    <td className="px-4 py-2">{t.count} шт.</td>
                    <td className="px-4 py-2">{t.hours} ч</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
