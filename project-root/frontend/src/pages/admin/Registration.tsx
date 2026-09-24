import { useState } from 'react';
import { Loader2, UserPlus, KeyRound, CheckCircle2, Save, IdCard } from 'lucide-react';
import { Card } from '@/components/ui';
import {
  adminApi,
  type CreateUserPayload,
  type EmployeeProfile,
} from '@/features/auth/api/adminApi';
import { toast } from 'sonner';

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

const inputStyle = {
  background: 'var(--iris-bg-app)',
  border: '1px solid var(--iris-border-subtle)',
  color: 'var(--text-primary)',
};

/** Вкладка «Регистрация»: карточка создания учётной записи пользователя. */
export default function RegistrationTab() {
  const [step, setStep] = useState<'user' | 'employee'>('user');
  const [userForm, setUserForm] = useState<UserFormData>(initialUserForm);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>(initialEmployeeForm);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; name: string; password: string } | null>(null);

  const setUser = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) =>
    setUserForm((prev) => ({ ...prev, [key]: value }));

  const setEmployee = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) =>
    setEmployeeForm((prev) => ({ ...prev, [key]: value }));

  const resetAll = () => {
    setStep('user');
    setUserForm(initialUserForm);
    setEmployeeForm(initialEmployeeForm);
    setRegisteredUserId(null);
  };

  const handleGenerate = () => {
    const pwd = generatePassword();
    setUserForm((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const user = await adminApi.createUser(payload);
      setRegisteredUserId(user.id);
      setCreated({
        email: user.email,
        name: user.full_name || user.username || user.email,
        password: userForm.password,
      });
      toast.success('Пользователь зарегистрирован');
      setUserForm(initialUserForm);
      setEmployeeForm(initialEmployeeForm);
      setStep('employee');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmployeeCard = async () => {
    if (!registeredUserId) return;
    setSaving(true);
    try {
      const payload: Partial<EmployeeProfile> = {
        user_id: registeredUserId,
        position: employeeForm.position || undefined,
        department: employeeForm.department || undefined,
        phone: employeeForm.phone || undefined,
        hire_date: employeeForm.hire_date || undefined,
        skills: employeeForm.skills
          ? employeeForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        certifications: employeeForm.certifications
          ? employeeForm.certifications.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        notes: employeeForm.notes || undefined,
      };
      await adminApi.updateEmployeeProfile(registeredUserId, payload);
      toast.success('Карточка сотрудника сохранена');
      resetAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка сохранения карточки');
    } finally {
      setSaving(false);
    }
  };

  const stepCircle = (num: number, active: boolean, done: boolean) => (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
        done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
      }`}
    >
      {num}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}
          >
            {step === 'user' ? <UserPlus size={18} /> : <IdCard size={18} />}
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {step === 'user' ? 'Регистрация пользователя' : 'Карточка сотрудника'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {step === 'user'
                ? 'Создание учётной записи для входа в систему'
                : `Дополнительные сведения о ${created?.name ?? 'сотруднике'} — можно заполнить позже`}
            </p>
          </div>
        </div>

        {/* Индикатор шагов */}
        <div className="flex items-center gap-2 pb-4 mb-4 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'user' ? 'text-blue-500' : 'text-green-500'}`}>
            {stepCircle(1, step === 'user', step === 'employee')}
            Учётная запись
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--iris-border-subtle)' }} />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'employee' ? 'text-blue-500' : 'text-gray-400'}`}>
            {stepCircle(2, step === 'employee', false)}
            Карточка сотрудника
          </div>
        </div>

        {created && step === 'employee' && (
          <div
            className="mb-5 flex items-start gap-2 rounded-lg border p-3 text-sm"
            style={{
              borderColor: 'rgba(12,114,5,0.3)',
              backgroundColor: 'rgba(12,114,5,0.06)',
              color: 'var(--text-primary)',
            }}
          >
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#0C7205' }} />
            <div>
              <div>
                Пользователь <strong>{created.name}</strong> ({created.email}) зарегистрирован.
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Пароль для передачи пользователю: <code>{created.password}</code>
              </div>
            </div>
          </div>
        )}

        {step === 'user' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUser('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                  placeholder="user@company.ru"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Логин
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUser('username', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                  placeholder="ivanov_ap"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                ФИО
              </label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUser('full_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
                placeholder="Иванов Александр Петрович"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Роль
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUser('role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Статус
                </label>
                <select
                  value={userForm.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setUser('is_active', e.target.value === 'active')}
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
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Пароль *
                </label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: '#3B82F6' }}
                >
                  <KeyRound size={12} />
                  Сгенерировать
                </button>
              </div>
              <input
                type="text"
                required
                value={userForm.password}
                onChange={(e) => setUser('password', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
                placeholder="Минимум 6 символов"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Подтверждение пароля *
              </label>
              <input
                type="text"
                required
                value={userForm.confirmPassword}
                onChange={(e) => setUser('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
                placeholder="Повторите пароль"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserForm(initialUserForm)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--iris-border-subtle)' }}
              >
                Очистить
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                style={{ background: '#3B82F6', color: '#fff' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Зарегистрировать
              </button>
            </div>
          </form>
        )}

        {step === 'employee' && registeredUserId && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Должность
                </label>
                <select
                  value={employeeForm.position}
                  onChange={(e) => setEmployee('position', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                >
                  <option value="">Выберите...</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Отдел
                </label>
                <select
                  value={employeeForm.department}
                  onChange={(e) => setEmployee('department', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                >
                  <option value="">Выберите...</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Телефон
                </label>
                <input
                  type="tel"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployee('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Дата приёма
                </label>
                <input
                  type="date"
                  value={employeeForm.hire_date}
                  onChange={(e) => setEmployee('hire_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Навыки (через запятую)
              </label>
              <input
                type="text"
                value={employeeForm.skills}
                onChange={(e) => setEmployee('skills', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
                placeholder="AutoCAD, Revit, Tekla, Project Management..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Сертификаты (через запятую)
              </label>
              <input
                type="text"
                value={employeeForm.certifications}
                onChange={(e) => setEmployee('certifications', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
                placeholder="ISO 9001, НАКС, Ростехнадзор..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Примечания
              </label>
              <textarea
                value={employeeForm.notes}
                onChange={(e) => setEmployee('notes', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                style={{ ...inputStyle, minHeight: '80px' }}
                placeholder="Дополнительная информация..."
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                ← Новая регистрация
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--iris-border-subtle)' }}
                >
                  Пропустить
                </button>
                <button
                  type="button"
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
      </Card>
    </div>
  );
}
