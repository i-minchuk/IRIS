import React, { useEffect, useState } from 'react';
import { Loader2, Shield, UserCheck, UserX, Mail, Calendar } from 'lucide-react';
import { adminApi, type AdminUser, type UserUpdatePayload } from '@/features/auth/api/adminApi';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: AdminUser) => {
    setSaving(true);
    try {
      const updated = await adminApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (payload: UserUpdatePayload) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateUser(editingUser.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    engineer: 'Инженер',
    norm_controller: 'Нормоконтролер',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Администрирование
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управление пользователями и ролями системы
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Shield size={16} />
          <span>Всего пользователей: {users.length}</span>
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
        <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Загрузка пользователей...</span>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-default)' }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Пользователь</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Email</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Роль</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Статус</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Создан</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b last:border-b-0 transition-colors hover:opacity-90"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: user.is_superuser ? 'var(--iris-accent-purple)' : 'var(--iris-accent-cyan)',
                          color: '#fff',
                        }}
                      >
                        {(user.full_name || user.username || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.full_name || user.username || '—'}
                        </div>
                        {user.is_superuser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--iris-accent-purple)', color: '#fff' }}>
                            Superuser
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: 'var(--bg-surface-2)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: user.is_active ? 'var(--iris-status-bg-green)' : 'var(--iris-status-bg-coral)',
                        color: user.is_active ? 'var(--iris-accent-green)' : 'var(--iris-accent-coral)',
                      }}
                    >
                      {user.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                      >
                        Изменить роль
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={saving}
                        className="px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                        style={{
                          backgroundColor: user.is_active ? 'var(--iris-status-bg-coral)' : 'var(--iris-status-bg-green)',
                          color: user.is_active ? 'var(--iris-accent-coral)' : 'var(--iris-accent-green)',
                        }}
                      >
                        {user.is_active ? 'Деактивировать' : 'Активировать'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}
    </div>
  );
};

interface EditUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (payload: UserUpdatePayload) => void;
  saving: boolean;
}

function EditUserModal({ user, onClose, onSave, saving }: EditUserModalProps) {
  const [role, setRole] = useState(user.role);
  const [fullName, setFullName] = useState(user.full_name || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-md rounded-xl border p-6 shadow-lg"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Редактирование пользователя
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Полное имя</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <option value="engineer">Инженер</option>
              <option value="manager">Менеджер</option>
              <option value="norm_controller">Нормоконтролер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
          >
            Отмена
          </button>
          <button
            onClick={() => onSave({ role, full_name: fullName || undefined })}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
