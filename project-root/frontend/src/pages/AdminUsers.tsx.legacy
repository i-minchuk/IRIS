import { useEffect, useState } from 'react';
import { getUsers, createUser, deactivateUser } from '../api/users';
import type { User } from '../types';
import StatusBadge from '../components/StatusBadge';
import { UserPlus, X } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'engineer', label: 'Инженер' },
  { value: 'manager', label: 'Руководитель' },
  { value: 'norm_controller', label: 'Нормоконтролёр' },
  { value: 'admin', label: 'Администратор' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'engineer' });

  const load = () => { getUsers().then(setUsers).catch(() => {}); };
  useEffect(load, []);

  const handleCreate = async () => {
    try {
      await createUser(form);
      setShowModal(false);
      setForm({ username: '', email: '', password: '', full_name: '', role: 'engineer' });
      load();
    } catch (error) {
      console.error('Failed to create user', error);
    }
  };


  const handleDeactivate = async (id: number) => {
    if (confirm('Деактивировать пользователя?')) {
      await deactivateUser(id);
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-medium">
          <UserPlus size={18} /> Добавить
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Имя</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Логин</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Роль</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{u.full_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4 text-sm">{ROLE_OPTIONS.find(r => r.value === u.role)?.label || u.role}</td>
                <td className="px-6 py-4">{u.is_active ? <StatusBadge status="active" /> : <StatusBadge status="archived" />}</td>
                <td className="px-6 py-4">
                  {u.is_active && (
                    <button onClick={() => handleDeactivate(u.id)} className="text-red-600 hover:text-red-700 text-sm">Деактивировать</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Новый пользователь</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="ФИО" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Логин" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Пароль" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button onClick={handleCreate} className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-medium">Создать</button>
          </div>
        </div>
      )}
    </div>
  );
}
