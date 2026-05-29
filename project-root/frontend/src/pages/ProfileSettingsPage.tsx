import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Lock, Bell } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import apiClient from '@/shared/api/client';
import { useAuth } from '@/context/useAuth';

interface ProfileForm {
  full_name: string;
  email: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
}

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileForm>({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [password, setPassword] = useState<PasswordForm>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: false,
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!profile.full_name.trim()) {
      nextErrors.full_name = 'Укажите имя';
    }
    if (!profile.email.trim()) {
      nextErrors.email = 'Укажите email';
    } else if (!/^\S+@\S+\.\S+$/.test(profile.email)) {
      nextErrors.email = 'Некорректный email';
    }

    const changingPassword =
      password.current_password || password.new_password || password.confirm_password;

    if (changingPassword) {
      if (!password.current_password) {
        nextErrors.current_password = 'Введите текущий пароль';
      }
      if (!password.new_password || password.new_password.length < 6) {
        nextErrors.new_password = 'Минимум 6 символов';
      }
      if (password.new_password !== password.confirm_password) {
        nextErrors.confirm_password = 'Пароли не совпадают';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [profile, password]);

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setSaved(false);

    try {
      const payload: Record<string, unknown> = {
        full_name: profile.full_name,
        email: profile.email,
        notifications,
      };

      const changingPassword =
        password.current_password && password.new_password;
      if (changingPassword) {
        payload.current_password = password.current_password;
        payload.new_password = password.new_password;
      }

      await apiClient.put('/users/me', payload);

      setSaved(true);
      if (changingPassword) {
        setPassword({ current_password: '', new_password: '', confirm_password: '' });
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const status = err?.response?.status;
      let message = 'Не удалось сохранить профиль';
      if (status === 400) message = 'Ошибка в данных';
      else if (status === 403) message = 'Доступ запрещён';
      else if (status === 404) message = 'Не найдено';
      else if (status === 422) message = 'Ошибка валидации';
      else if (status >= 500) message = 'Ошибка сервера';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Настройки профиля
        </h1>
      </div>

      <div className="space-y-6">
        {/* Profile info */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} style={{ color: 'var(--brand-iris)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Основная информация
            </h2>
          </div>

          <Input
            label="Имя"
            placeholder="Ваше полное имя"
            value={profile.full_name}
            onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
            error={errors.full_name}
          />

          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            error={errors.email}
          />
        </Card>

        {/* Password */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={18} style={{ color: 'var(--brand-iris)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Смена пароля
            </h2>
          </div>

          <Input
            label="Текущий пароль"
            type="password"
            placeholder="••••••••"
            value={password.current_password}
            onChange={(e) =>
              setPassword((p) => ({ ...p, current_password: e.target.value }))
            }
            error={errors.current_password}
          />

          <Input
            label="Новый пароль"
            type="password"
            placeholder="Минимум 6 символов"
            value={password.new_password}
            onChange={(e) =>
              setPassword((p) => ({ ...p, new_password: e.target.value }))
            }
            error={errors.new_password}
          />

          <Input
            label="Подтверждение пароля"
            type="password"
            placeholder="Повторите новый пароль"
            value={password.confirm_password}
            onChange={(e) =>
              setPassword((p) => ({ ...p, confirm_password: e.target.value }))
            }
            error={errors.confirm_password}
          />
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} style={{ color: 'var(--brand-iris)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Уведомления
            </h2>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={notifications.email}
              onChange={(e) =>
                setNotifications((n) => ({ ...n, email: e.target.checked }))
              }
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Email-уведомления
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={notifications.push}
              onChange={(e) =>
                setNotifications((n) => ({ ...n, push: e.target.checked }))
              }
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Push-уведомления
            </span>
          </label>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={loading}
            leftIcon={<Save size={16} />}
          >
            Сохранить
          </Button>

          {saved && (
            <span className="text-sm" style={{ color: 'var(--accent-leaders)' }}>
              Сохранено
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
