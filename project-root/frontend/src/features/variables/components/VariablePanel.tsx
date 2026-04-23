import React, { useEffect, useState } from 'react';
import { variablesApi, type Variable } from '../api/variables';

interface Props {
  projectId?: number;
  documentId?: number;
  onChange?: () => void;
}

export const VariablePanel: React.FC<Props> = ({ projectId, documentId, onChange }) => {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(false);
  const [newVar, setNewVar] = useState<{ key: string; value: string; scope: 'project' | 'document' }>({ key: '', value: '', scope: 'project' });

  useEffect(() => {
    const params: { scope?: string; project_id?: number } = {};
    if (projectId) params.project_id = projectId;
    setLoading(true);
    variablesApi
      .list(params)
      .then((res: { data: Variable[] }) => setVariables(res.data))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCreate = async () => {
    if (!newVar.key) return;
    await variablesApi.create({
      key: newVar.key,
      value: newVar.value,
      scope: newVar.scope,
      project_id: projectId,
      document_id: documentId,
    });
    setNewVar({ key: '', value: '', scope: 'project' });
    const params: { scope?: string; project_id?: number } = {};
    if (projectId) params.project_id = projectId;
    const res = await variablesApi.list(params);
    setVariables(res.data);
    onChange?.();
  };

  const handleUpdate = async (id: number, value: string) => {
    await variablesApi.update(id, { value });
    setVariables((prev) => prev.map((v) => (v.id === id ? { ...v, value } : v)));
    onChange?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Ключ"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          value={newVar.key}
          onChange={(e) => setNewVar((p) => ({ ...p, key: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Значение"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          value={newVar.value}
          onChange={(e) => setNewVar((p) => ({ ...p, value: e.target.value }))}
        />
        <select
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          value={newVar.scope}
          onChange={(e) => setNewVar((p) => ({ ...p, scope: e.target.value as 'project' | 'document' }))}
        >
          <option value="project">Проект</option>
          <option value="document">Документ</option>
        </select>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          Добавить
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">Загрузка…</div>}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-1 pr-4">Ключ</th>
            <th className="pb-1 pr-4">Значение</th>
            <th className="pb-1 pr-4">Область</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((v) => (
            <tr key={v.id} className="border-b border-gray-100">
              <td className="py-1 pr-4 font-mono text-xs text-gray-700">{'{{' + v.key + '}}'}</td>
              <td className="py-1 pr-4">
                <input
                  type="text"
                  className="w-full rounded border border-gray-200 px-1 py-0.5 text-sm"
                  value={v.value || ''}
                  onBlur={(e) => handleUpdate(v.id, e.target.value)}
                  onChange={(e) =>
                    setVariables((prev) => prev.map((pv) => (pv.id === v.id ? { ...pv, value: e.target.value } : pv)))
                  }
                />
              </td>
              <td className="py-1 pr-4 text-gray-500">{v.scope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
