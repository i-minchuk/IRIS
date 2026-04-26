import React, { useEffect, useState } from 'react';
import { getTenders, createTender, calculateTender, type Tender } from '@/api/tender';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

const TEMPLATES = [
  { key: 'assembly_drawing', name: 'Сборочный чертёж', icon: '📐' },
  { key: 'specification', name: 'Спецификация', icon: '📋' },
  { key: 'passport', name: 'Паспорт изделия', icon: '📄' },
  { key: 'manual', name: 'Руководство по эксплуатации', icon: '📖' },
];

const STANDARDS = ['ГОСТ 2.105', 'СНиП 3.03', 'СП 16', 'Требования заказчика'];

export const TendersPage: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTender, setNewTender] = useState<Partial<Tender>>({
    name: '', customer_name: '', project_type: 'KM', volume: undefined, complexity: 'medium', standards: [],
  });
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    const data = await getTenders();
    setTenders(data);
  };

  const handleCreate = async () => {
    await createTender(newTender);
    setShowCreate(false);
    setNewTender({ name: '', customer_name: '', project_type: 'KM', volume: undefined, complexity: 'medium', standards: [] });
    loadTenders();
  };

  const handleCalculate = async (tender: Tender) => {
    setSelectedTender(tender);
    setCalcLoading(true);
    try {
      const result = await calculateTender(tender.id);
      setCalcResult(result);
    } catch {
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Тендеры</h2>
        <Button onClick={() => setShowCreate(true)}>+ Новый тендер</Button>
      </div>

      {/* Tender list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenders.map((tender) => (
          <div key={tender.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{tender.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${tender.status === 'won' ? 'bg-green-100 text-green-700' : tender.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {tender.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{tender.customer_name}</p>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-3">
              <span>{tender.project_type} · {tender.complexity}</span>
              <span>{tender.volume} {tender.volume_unit || 'тонн'}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleCalculate(tender)}>📊 Рассчитать</Button>
              {tender.calculated_cost && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{tender.calculated_cost.toLocaleString('ru-RU')} ₽</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Calculation result */}
      {selectedTender && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Расчёт: {selectedTender.name}</h3>
            <button onClick={() => { setSelectedTender(null); setCalcResult(null); }} className="text-gray-400 dark:text-gray-500 hover:text-gray-600">✕</button>
          </div>

          {calcLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Расчёт…</div>}

          {!calcLoading && calcResult && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded border border-blue-100 p-3">
                  <div className="text-2xl font-bold text-blue-700">{calcResult.total_hours}</div>
                  <div className="text-xs text-blue-600">чел-часов</div>
                </div>
                <div className="bg-emerald-50 rounded border border-emerald-100 p-3">
                  <div className="text-2xl font-bold text-emerald-700">{calcResult.duration_months}</div>
                  <div className="text-xs text-emerald-600">месяцев</div>
                </div>
                <div className="bg-purple-50 rounded border border-purple-100 p-3">
                  <div className="text-2xl font-bold text-purple-700">{calcResult.team_size}</div>
                  <div className="text-xs text-purple-600">человек</div>
                </div>
                <div className="bg-amber-50 rounded border border-amber-100 p-3">
                  <div className="text-2xl font-bold text-amber-700">{calcResult.overload_risk ? '🔴' : '🟢'}</div>
                  <div className="text-xs text-amber-600">{calcResult.overload_risk ? 'Риск' : 'Норма'}</div>
                </div>
              </div>

              {/* Team composition */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Состав команды</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(calcResult.team_composition).map(([role, count]) => (
                    <span key={role} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {role}: {count as number}
                    </span>
                  ))}
                </div>
              </div>

              {/* Monthly load chart */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Загрузка команды по месяцам</h4>
                <div className="space-y-2">
                  {calcResult.monthly_load.map((item: any) => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-12">Мес {item.month}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-4 rounded-full text-[10px] text-white flex items-center px-1 ${
                            item.status === 'risk' ? 'bg-red-500' : item.status === 'high' ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, item.utilization)}%` }}
                        >
                          {item.utilization > 20 && `${item.utilization}%`}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-16">{item.hours}ч</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {calcResult.recommendations.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded p-3">
                  <h4 className="text-sm font-semibold text-red-700 mb-1">⚠️ Рекомендации</h4>
                  <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                    {calcResult.recommendations.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Document estimate */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Оценка документации</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(calcResult.document_estimate).map(([doc, count]) => (
                    <div key={doc} className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2 text-center">
                      <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{count as number}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{doc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Template library */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Библиотека шаблонов документации</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TEMPLATES.map((t) => (
            <div key={t.key} className="border border-gray-200 dark:border-gray-700 rounded p-3 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.name}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">[Просмотреть пример]</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">⚠️ Это приблизительные документы для оценки объёма работ. Окончательная версия разрабатывается после выигрыша тендера.</p>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Новый тендер" isOpen={showCreate} onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <Input placeholder="Название тендера" value={newTender.name || ''} onChange={(e) => setNewTender({ ...newTender, name: e.target.value })} />
            <Input placeholder="Заказчик" value={newTender.customer_name || ''} onChange={(e) => setNewTender({ ...newTender, customer_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm" value={newTender.project_type} onChange={(e) => setNewTender({ ...newTender, project_type: e.target.value })}>
                <option value="KM">КМ</option>
                <option value="PD">ПД</option>
                <option value="AK">АК</option>
                <option value="montazh">Монтаж</option>
                <option value="smety">Сметы</option>
              </select>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm" value={newTender.complexity} onChange={(e) => setNewTender({ ...newTender, complexity: e.target.value })}>
                <option value="low">Низкая сложность</option>
                <option value="medium">Средняя сложность</option>
                <option value="high">Высокая сложность</option>
              </select>
            </div>
            <Input placeholder="Объём (тонн / м²)" type="number" value={newTender.volume || ''} onChange={(e) => setNewTender({ ...newTender, volume: Number(e.target.value) })} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Стандарты:</div>
              <div className="flex flex-wrap gap-2">
                {STANDARDS.map((std) => (
                  <label key={std} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={(newTender.standards || []).includes(std)}
                      onChange={(e) => {
                        const prev = newTender.standards || [];
                        if (e.target.checked) setNewTender({ ...newTender, standards: [...prev, std] });
                        else setNewTender({ ...newTender, standards: prev.filter((s) => s !== std) });
                      }}
                    />
                    {std}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
              <Button onClick={handleCreate}>Создать</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
