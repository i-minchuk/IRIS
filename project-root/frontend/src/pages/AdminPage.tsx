import React, { useEffect, useState } from 'react';
import {
  Loader2, Shield, UserCheck, UserX, Mail, Calendar,
  UserPlus, X, KeyRound, Edit3, Save
} from 'lucide-react';
import {
  adminApi,
  type AdminUser,
  type CreateUserPayload,
  type EmployeeProfile,
} from '@/features/auth/api/adminApi';
import { toast } from 'sonner';
import { useTheme } from '@/providers/ThemeProvider';
import { IRISRecommendations } from '@/components/IRISRecommendations';

/* ─── Role config ─── */
const ROLE_OPTIONS = [
  { value: 'engineer', label: 'Инженер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'department_head', label: 'Начальник отдела' },
  { value: 'gip', label: 'ГИП' },
  { value: 'site_manager', label: 'Руководитель участка' },
  { value: 'norm_controller', label: 'Нормоконтролер' },
  { value: 'deputy_director', label: 'Зам. директора' },
  { value: 'director', label: 'Директор' },
  { value: 'admin', label: 'Администратор' },
];

const DEPARTMENTS = [
  'ПТО', 'ОВиК', 'АСУТП', 'ЭО', 'ТО', 'СМК', 'Бухгалтерия', 'HR', 'IT',
];

const POSITIONS = [
  'Инженер', 'Ведущий инженер', 'Главный инженер', 'Специалист',
  'Мастер участка', 'Технолог', 'Начальник отдела', 'ГИП',
  'Менеджер проекта', 'Нормоконтролер', 'Старший мастер',
];

/* ─── Types ─── */
interface UserFormData {
  email: string;
  username: string;
  full_name: string;
  role: string;
  password: string;
  confirmPassword: string;
  is_active: boolean;
}

interface EmployeeFormData {
  position: string;
  department: string;
  phone: string;
  hire_date: string;
  skills: string;
  certifications: string;
  notes: string;
}

/* ─── Helpers ─── */
const initialUserForm: UserFormData = {
  email: '',
  username: '',
  full_name: '',
  role: 'engineer',
  password: '',
  confirmPassword: '',
  is_active: true,
};

const initialEmployeeForm: EmployeeFormData = {
  position: '',
  department: '',
  phone: '',
  hire_date: '',
  skills: '',
  certifications: '',
  notes: '',
};

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

/* ─── Main Component ─── */
export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* Registration modal */
  const [showRegister, setShowRegister] = useState(false);
  const [userForm, setUserForm] = useState<UserFormData>(initialUserForm);
  const [registerStep, setRegisterStep] = useState<'user' | 'employee'>('user');
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);

  /* Employee card modal */
  const [showEmployeeCard, setShowEmployeeCard] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>(initialEmployeeForm);
  const [employeeUser, setEmployeeUser] = useState<AdminUser | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';

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

  /* ─── Registration ─── */
  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setUserForm((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }));
  };

  const handleRegisterUser = async () => {
    if (!userForm.email || !userForm.password) {
      toast.error('Email и пароль обязательны');
      return;
    }
    if (userForm.password !== userForm.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (userForm.password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateUserPayload = {
        email: userForm.email,
        username: userForm.username || undefined,
        full_name: userForm.full_name || undefined,
        role: userForm.role,
        password: userForm.password,
        is_active: userForm.is_active,
      };
      const newUser = await adminApi.createUser(payload);
      setRegisteredUserId(newUser.id);
      setUsers((prev) => [newUser, ...prev]);
      toast.success('Пользователь зарегистрирован');
      setRegisterStep('employee');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmployeeCard = async () => {
    if (!registeredUserId && !employeeUser) return;
    const userId = registeredUserId || employeeUser!.id;

    setSaving(true);
    try {
      const payload: Partial<EmployeeProfile> = {
        user_id: userId,
        position: employeeForm.position || undefined,
        department: employeeForm.department || undefined,
        phone: employeeForm.phone || undefined,
        hire_date: employeeForm.hire_date || undefined,
        skills: employeeForm.skills ? employeeForm.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        certifications: employeeForm.certifications ? employeeForm.certifications.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        notes: employeeForm.notes || undefined,
      };
      await adminApi.updateEmployeeProfile(userId, payload);
      toast.success('Карточка сотрудника сохранена');
      setShowRegister(false);
      setShowEmployeeCard(false);
      setUserForm(initialUserForm);
      setEmployeeForm(initialEmployeeForm);
      setRegisteredUserId(null);
      setEmployeeUser(null);
      setRegisterStep('user');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка сохранения карточки');
    } finally {
      setSaving(false);
    }
  };

  const openEmployeeCard = async (user: AdminUser) => {
    setEmployeeUser(user);
    setEmployeeLoading(true);
    setShowEmployeeCard(true);
    try {
      const profile = await adminApi.getEmployeeProfile(user.id);
      if (profile) {
        setEmployeeForm({
          position: profile.position || '',
          department: profile.department || '',
          phone: profile.phone || '',
          hire_date: profile.hire_date || '',
          skills: profile.skills?.join(', ') || '',
          certifications: profile.certifications?.join(', ') || '',
          notes: profile.notes || '',
        });
      } else {
        setEmployeeForm(initialEmployeeForm);
      }
    } catch {
      setEmployeeForm(initialEmployeeForm);
    } finally {
      setEmployeeLoading(false);
    }
  };

  /* ─── Existing handlers ─── */
  const handleToggleActive = async (user: AdminUser) => {
    setSaving(true);
    try {
      const updated = await adminApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`Пользователь ${updated.is_active ? 'активирован' : 'деактивирован'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    engineer: 'Инженер',
    norm_controller: 'Нормоконтролер',
    department_head: 'Начальник отдела',
    gip: 'ГИП',
    site_manager: 'Руководитель участка',
    deputy_director: 'Зам. директора',
    director: 'Директор',
  };

  const inputStyle = {
    background: 'var(--iris-bg-app)',
    border: '1px solid var(--iris-border-subtle)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <IRISRecommendations page="admin" isDark={isDark} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            Администрирование
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управление пользователями и ролями системы
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Shield size={16} />
            <span>Всего пользователей: {users.length}</span>
          </div>
          <button
            onClick={() => {
              setUserForm(initialUserForm);
              setEmployeeForm(initialEmployeeForm);
              setRegisterStep('user');
              setRegisteredUserId(null);
              setShowRegister(true);
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ background: '#3B82F6', color: '#fff' }}
          >
            <UserPlus size={14} />
            Зарегистрировать пользователя
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: 'var(--error)', backgroundColor: 'var(--error-bg, #fef2f2)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Загрузка пользователей...</span>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
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
                <tr key={user.id} className="border-b last:border-b-0 transition-colors hover:opacity-90" style={{ borderColor: 'var(--border-default)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: user.is_superuser ? 'var(--iris-accent-purple)' : 'var(--iris-accent-cyan)', color: '#fff' }}>
                        {(user.full_name || user.username || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.full_name || user.username || '—'}
                        </div>
                        {user.is_superuser && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--iris-accent-purple)', color: '#fff' }}>Superuser</span>
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
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--iris-bg-hover)', color: 'var(--text-secondary)' }}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors"
                      style={{
                        backgroundColor: user.is_active ? 'rgba(12,114,5,0.12)' : 'rgba(220,38,38,0.12)',
                        color: user.is_active ? '#0C7205' : '#DC2626',
                      }}
                    >
                      {user.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </button>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEmployeeCard(user)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Карточка сотрудника"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Registration Modal ─── */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-xl border overflow-hidden max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {registerStep === 'user' ? 'Регистрация пользователя' : 'Карточка сотрудника'}
              </h2>
              <button
                onClick={() => {
                  setShowRegister(false);
                  setRegisterStep('user');
                  setRegisteredUserId(null);
                }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 px-6 py-3 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${registerStep === 'user' ? 'text-blue-500' : 'text-green-500'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${registerStep === 'user' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>1</div>
                Учётная запись
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--iris-border-subtle)' }} />
              <div className={`flex items-center gap-1.5 text-xs font-medium ${registerStep === 'employee' ? 'text-blue-500' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${registerStep === 'employee' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
                Карточка сотрудника
              </div>
            </div>

            {/* Step 1: User registration */}
            {registerStep === 'user' && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Email *</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                      placeholder="user@company.ru"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Логин</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                      placeholder="ivanov_ap"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>ФИО</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                    placeholder="Иванов Александр Петрович"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Роль</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Статус</label>
                    <select
                      value={userForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, is_active: e.target.value === 'active' }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      <option value="active">Активен</option>
                      <option value="inactive">Неактивен</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Пароль *</label>
                    <button
                      onClick={handleGeneratePassword}
                      className="text-xs flex items-center gap-1 transition-colors"
                      style={{ color: '#3B82F6' }}
                    >
                      <KeyRound size={12} />
                      Сгенерировать
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userForm.password}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                      placeholder="Минимум 6 символов"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Подтверждение пароля *</label>
                  <input
                    type="text"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                    placeholder="Повторите пароль"
                  />
                </div>

                {userForm.password && (
                  <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--iris-bg-hover)', color: 'var(--text-secondary)' }}>
                    <strong>Сгенерированный пароль:</strong> {userForm.password}
                    <br />
                    <span style={{ color: 'var(--text-muted)' }}>Скопируйте и передайте пользователю</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowRegister(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--iris-border-subtle)' }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleRegisterUser}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                    style={{ background: '#3B82F6', color: '#fff' }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Зарегистрировать
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Employee card */}
            {registerStep === 'employee' && registeredUserId && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Должность</label>
                    <select
                      value={employeeForm.position}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      <option value="">Выберите...</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Отдел</label>
                    <select
                      value={employeeForm.department}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      <option value="">Выберите...</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Телефон</label>
                    <input
                      type="tel"
                      value={employeeForm.phone}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Дата приёма</label>
                    <input
                      type="date"
                      value={employeeForm.hire_date}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, hire_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Навыки (через запятую)</label>
                  <input
                    type="text"
                    value={employeeForm.skills}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, skills: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                    placeholder="AutoCAD, Revit, Tekla, Project Management..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Сертификаты (через запятую)</label>
                  <input
                    type="text"
                    value={employeeForm.certifications}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, certifications: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                    placeholder="ISO 9001, НАКС, Ростехнадзор..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Примечания</label>
                  <textarea
                    value={employeeForm.notes}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                    style={{ ...inputStyle, minHeight: '80px' }}
                    placeholder="Дополнительная информация..."
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => {
                      setRegisterStep('user');
                      setRegisteredUserId(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ← Назад
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRegister(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)', border: '1px solid var(--iris-border-subtle)' }}
                    >
                      Пропустить
                    </button>
                    <button
                      onClick={handleSaveEmployeeCard}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                      style={{ background: '#0C7205', color: '#fff' }}
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Сохранить карточку
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Employee Card Modal (for existing users) ─── */}
      {showEmployeeCard && employeeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-xl border overflow-hidden max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--iris-accent-cyan)', color: '#fff' }}>
                  {(employeeUser.full_name || employeeUser.username || employeeUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {employeeUser.full_name || employeeUser.username || employeeUser.email}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{employeeUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeCard(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {employeeLoading ? (
              <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'var(--text-secondary)' }}>
                <Loader2 size={18} className="animate-spin" />
                <span>Загрузка карточки...</span>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Должность</label>
                    <select
                      value={employeeForm.position}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      <option value="">Выберите...</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Отдел</label>
                    <select
                      value={employeeForm.department}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      <option value="">Выберите...</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Телефон</label>
                    <input
                      type="tel"
                      value={employeeForm.phone}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Дата приёма</label>
                    <input
                      type="date"
                      value={employeeForm.hire_date}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, hire_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Навыки (через запятую)</label>
                  <input
                    type="text"
                    value={employeeForm.skills}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, skills: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                    placeholder="AutoCAD, Revit, Tekla, Project Management..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Сертификаты (через запятую)</label>
                  <input
                    type="text"
                    value={employeeForm.certifications}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, certifications: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                    placeholder="ISO 9001, НАКС, Ростехнадзор..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Примечания</label>
                  <textarea
                    value={employeeForm.notes}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                    style={{ ...inputStyle, minHeight: '80px' }}
                    placeholder="Дополнительная информация..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowEmployeeCard(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--iris-border-subtle)' }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveEmployeeCard}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                    style={{ background: '#0C7205', color: '#fff' }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Сохранить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
