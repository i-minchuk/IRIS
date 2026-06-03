import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, User, Lock, Bell, Shield, Palette, Globe,
  Star, Flame, Coins, Trophy, Award, Zap, Crown, Gamepad2,
  ChevronRight, BarChart3, Camera, Trash2,
} from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import apiClient from '@/shared/api/client';
import { useAuth } from '@/context/useAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getLevelInfo } from '@/lib/levelSystem';
import { formatXP } from '@/lib/xpEngine';

/* ─── Types ─── */
interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  location: string;
  bio: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationChannel {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

/* ─── Rarity colours for badges ─── */
const RARITY_COLORS: Record<string, string> = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#D4AF37',
};

/* ─── Component ─── */
export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemoMode = useAuthStore((state) => state.isDemoMode);

  /* Gamification */
  const { xp, coins, streak, badges, quests, getCurrentLevel, getLevelProgress } = useGamificationStore();
  const level = getCurrentLevel();
  const progress = getLevelProgress();
  const levelInfo = getLevelInfo(level);
  const earnedBadges = badges.filter((b) => b.earnedAt);
  const activeQuests = quests.filter((q) => !q.claimed && !q.completed);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'gamification'>('profile');

  /* Profile form */
  const [profile, setProfile] = useState<ProfileForm>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '+7 (999) 123-45-67',
    position: 'Главный инженер',
    department: 'Отдел КМ',
    location: 'Москва, офис 304',
    bio: 'Инженер-конструктор с 8-летним опытом в проектировании металлоконструкций.',
  });

  /* Avatar */
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('iris_profile_avatar');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Language & Timezone */
  const [language, setLanguage] = useState<'ru' | 'en'>(() => {
    if (typeof window === 'undefined') return 'ru';
    return (localStorage.getItem('iris_profile_language') as 'ru' | 'en') || 'ru';
  });
  const [timezone, setTimezone] = useState(() => {
    if (typeof window === 'undefined') return 'Europe/Moscow';
    return localStorage.getItem('iris_profile_timezone') || 'Europe/Moscow';
  });

  /* Password form */
  const [password, setPassword] = useState<PasswordForm>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  /* Notifications */
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'email_digest', label: 'Ежедневный дайджест', description: 'Сводка событий за день', enabled: true },
    { id: 'document_approval', label: 'Согласование документов', description: 'Когда документ требует вашего согласия', enabled: true },
    { id: 'task_deadline', label: 'Дедлайны задач', description: 'Напоминания за 24 и 4 часа', enabled: true },
    { id: 'mentions', label: 'Упоминания', description: 'Когда кто-то упомянул вас', enabled: true },
    { id: 'system', label: 'Системные', description: 'Обновления, бэкапы, инциденты', enabled: false },
    { id: 'marketing', label: 'Новости продукта', description: 'Новые функции и обновления', enabled: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ─── Validation ─── */
  const validate = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!profile.full_name.trim()) nextErrors.full_name = 'Укажите имя';
    if (!profile.email.trim()) nextErrors.email = 'Укажите email';
    else if (!/^\S+@\S+\.\S+$/.test(profile.email)) nextErrors.email = 'Некорректный email';

    const changingPassword = password.current_password || password.new_password || password.confirm_password;
    if (changingPassword) {
      if (!password.current_password) nextErrors.current_password = 'Введите текущий пароль';
      if (!password.new_password || password.new_password.length < 6) nextErrors.new_password = 'Минимум 6 символов';
      if (password.new_password !== password.confirm_password) nextErrors.confirm_password = 'Пароли не совпадают';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [profile, password]);

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        position: profile.position,
        department: profile.department,
        location: profile.location,
        bio: profile.bio,
        language,
        timezone,
        avatar_url: avatarUrl,
      };
      const changingPassword = password.current_password && password.new_password;
      if (changingPassword) {
        payload.current_password = password.current_password;
        payload.new_password = password.new_password;
      }

      if (isDemoMode) {
        // Demo mode: save to localStorage only
        localStorage.setItem('iris_profile_full_name', profile.full_name);
        localStorage.setItem('iris_profile_email', profile.email);
        localStorage.setItem('iris_profile_phone', profile.phone);
        localStorage.setItem('iris_profile_position', profile.position);
        localStorage.setItem('iris_profile_department', profile.department);
        localStorage.setItem('iris_profile_location', profile.location);
        localStorage.setItem('iris_profile_bio', profile.bio);
        localStorage.setItem('iris_profile_language', language);
        localStorage.setItem('iris_profile_timezone', timezone);
        if (avatarUrl) localStorage.setItem('iris_profile_avatar', avatarUrl);
        else localStorage.removeItem('iris_profile_avatar');
        toast.success('Профиль сохранён (демо-режим)');
      } else {
        // Real mode: send to backend
        await apiClient.put('/users/me', payload);
        toast.success('Профиль сохранён');
      }

      setSaved(true);
      if (changingPassword) setPassword({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error('Не удалось сохранить профиль');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Tabs config ─── */
  const tabs = [
    { id: 'profile' as const, label: 'Профиль', icon: <User size={16} /> },
    { id: 'security' as const, label: 'Безопасность', icon: <Shield size={16} /> },
    { id: 'notifications' as const, label: 'Уведомления', icon: <Bell size={16} /> },
    { id: 'gamification' as const, label: 'Игровой профиль', icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Настройки профиля</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Управление аккаунтом, безопасностью и игровым прогрессом
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card padding="sm" className="sticky top-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--brand-iris)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'gamification' && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-2)' }}>
                      Lv.{level}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Mini gamification preview in sidebar */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${levelInfo.tierColor}20`, color: levelInfo.tierColor, border: `2px solid ${levelInfo.tierColor}` }}
                >
                  {level}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile.full_name || 'Пользователь'}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{levelInfo.title}</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: levelInfo.tierColor }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* ═══ TAB: PROFILE ═══ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar + Basic */}
              <Card padding="lg" className="space-y-6">
                <div className="flex items-center gap-5">
                  {/* Avatar with upload */}
                  <div className="relative group">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden transition-transform group-hover:scale-[1.02]"
                      style={{
                        backgroundColor: avatarUrl ? 'transparent' : `${levelInfo.tierColor}20`,
                        color: levelInfo.tierColor,
                        border: `3px solid ${levelInfo.tierColor}`,
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (() => {
                          const parts = profile.full_name.trim().split(/\s+/);
                          const initials = parts.slice(0, 2).map(p => p.charAt(0)).join('');
                          return initials || '?';
                        })()
                      )}
                    </div>
                    {/* Overlay button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                      title="Загрузить фото"
                    >
                      <Camera size={20} style={{ color: '#fff' }} />
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                        title="Удалить фото"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Файл слишком большой (макс. 5 МБ)');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Основная информация</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Эти данные видны другим пользователям</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="sm" leftIcon={<Camera size={14} />} onClick={() => fileInputRef.current?.click()}>
                        Загрузить фото
                      </Button>
                      {avatarUrl && (
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setAvatarUrl(null)} style={{ color: 'var(--error)' }}>
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Полное имя" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} error={errors.full_name} />
                  <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} error={errors.email} />
                  <Input label="Телефон" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                  <Input label="Должность" value={profile.position} onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))} />
                  <Input label="Отдел" value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} />
                  <Input label="Локация" value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>О себе</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 resize-none"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
              </Card>

              {/* Preferences */}
              <Card padding="lg" className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Palette size={18} style={{ color: 'var(--brand-iris)' }} /> Предпочтения
                </h2>

                {/* Theme selector */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Тема оформления</label>
                  <ThemeSelector />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Language selector */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Язык интерфейса</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    >
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  {/* Timezone selector */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Часовой пояс</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Europe/London">GMT — London</option>
                      <option value="Europe/Paris">CET — Paris, Berlin, Rome</option>
                      <option value="Europe/Helsinki">EET — Helsinki, Athens, Bucharest</option>
                      <option value="Europe/Moscow">MSK — Moscow, Minsk</option>
                      <option value="Asia/Dubai">GST — Dubai</option>
                      <option value="Asia/Tashkent">UZT — Tashkent</option>
                      <option value="Asia/Almaty">ALMT — Almaty</option>
                      <option value="Asia/Tbilisi">GET — Tbilisi</option>
                      <option value="Asia/Yerevan">AMT — Yerevan</option>
                      <option value="Asia/Tehran">IRST — Tehran</option>
                      <option value="Asia/Delhi">IST — Delhi, Mumbai</option>
                      <option value="Asia/Shanghai">CST — Shanghai, Beijing</option>
                      <option value="Asia/Tokyo">JST — Tokyo, Seoul</option>
                      <option value="Asia/Singapore">SGT — Singapore</option>
                      <option value="Australia/Sydney">AEST — Sydney, Melbourne</option>
                      <option value="America/New_York">EST — New York, Miami</option>
                      <option value="America/Chicago">CST — Chicago, Dallas</option>
                      <option value="America/Denver">MST — Denver, Phoenix</option>
                      <option value="America/Los_Angeles">PST — Los Angeles, Seattle</option>
                      <option value="America/Toronto">EST — Toronto</option>
                      <option value="America/Sao_Paulo">BRT — São Paulo</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ═══ TAB: SECURITY ═══ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card padding="lg" className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Lock size={18} style={{ color: 'var(--brand-iris)' }} /> Смена пароля
                </h2>
                <Input label="Текущий пароль" type="password" value={password.current_password} onChange={(e) => setPassword((p) => ({ ...p, current_password: e.target.value }))} error={errors.current_password} />
                <Input label="Новый пароль" type="password" value={password.new_password} onChange={(e) => setPassword((p) => ({ ...p, new_password: e.target.value }))} error={errors.new_password} />
                <Input label="Подтверждение пароля" type="password" value={password.confirm_password} onChange={(e) => setPassword((p) => ({ ...p, confirm_password: e.target.value }))} error={errors.confirm_password} />
              </Card>

              <Card padding="lg" className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Shield size={18} style={{ color: 'var(--brand-iris)' }} /> Двухфакторная аутентификация
                </h2>
                <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>TOTP (Google Authenticator)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Защитите аккаунт дополнительным кодом</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/profile/2fa')}>Настроить</Button>
                </div>
              </Card>

              <Card padding="lg" className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Globe size={18} style={{ color: 'var(--brand-iris)' }} /> Активные сессии
                </h2>
                <div className="space-y-2">
                  {[
                    { device: 'Chrome / Windows', ip: '192.168.1.45', location: 'Москва, Россия', current: true },
                    { device: 'Safari / macOS', ip: '192.168.1.32', location: 'Москва, Россия', current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                          <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {session.device} {session.current && <Badge variant="success" className="ml-2 text-[10px]">Текущая</Badge>}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{session.ip} • {session.location}</div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="ghost" size="sm" className="text-xs" style={{ color: 'var(--error)' }}>Завершить</Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ═══ TAB: NOTIFICATIONS ═══ */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card padding="lg" className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Bell size={18} style={{ color: 'var(--brand-iris)' }} /> Каналы уведомлений
                </h2>
                <div className="space-y-3">
                  {channels.map((ch) => (
                    <label key={ch.id} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:opacity-90" style={{ borderColor: 'var(--border-default)' }}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded mt-0.5"
                        checked={ch.enabled}
                        onChange={(e) => setChannels((prev) => prev.map((c) => (c.id === ch.id ? { ...c, enabled: e.target.checked } : c)))}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ch.label}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ch.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ═══ TAB: GAMIFICATION ═══ */}
          {activeTab === 'gamification' && (
            <div className="space-y-6">
              {/* Level Header */}
              <Card padding="lg">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: `${levelInfo.tierColor}20`, color: levelInfo.tierColor, border: `3px solid ${levelInfo.tierColor}` }}
                  >
                    {level}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Игровой профиль</h2>
                      <Badge variant="leaders" leftIcon={<Crown size={12} />}>{levelInfo.title}</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>Уровень {level}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: levelInfo.tierColor }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card padding="sm" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${levelInfo.tierColor}18` }}>
                    <Star size={18} style={{ color: levelInfo.tierColor }} />
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatXP(xp)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>XP</div>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, #F59E0B 10%, var(--bg-surface))' }}>
                    <Coins size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{coins}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Монет</div>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, #EF4444 10%, var(--bg-surface))' }}>
                    <Flame size={18} style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{streak}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Streak 🔥</div>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, #D4AF37 10%, var(--bg-surface))' }}>
                    <Trophy size={18} style={{ color: '#D4AF37' }} />
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{earnedBadges.length}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Бейджей</div>
                  </div>
                </Card>
              </div>

              {/* Active Quests */}
              <Card padding="lg">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Zap size={16} style={{ color: 'var(--brand-iris)' }} /> Активные квесты
                </h3>
                <div className="space-y-3">
                  {activeQuests.map((quest) => (
                    <div key={quest.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{quest.title}</span>
                        <Badge variant={quest.type === 'daily' ? 'info' : 'warning'}>{quest.type === 'daily' ? 'Ежедневный' : 'Еженедельный'}</Badge>
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{quest.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span>{quest.current} / {quest.target}</span>
                          <span>{Math.round((quest.current / quest.target) * 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(quest.current / quest.target) * 100}%`, backgroundColor: quest.completed ? 'var(--success)' : 'var(--brand-iris)' }} />
                        </div>
                      </div>
                      {quest.completed && !quest.claimed && (
                        <Button size="sm" className="mt-2" onClick={() => useGamificationStore.getState().claimQuestReward(quest.id)}>
                          Получить: {quest.xpReward} XP + {quest.coinReward} 🪙
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Badges */}
              <Card padding="lg">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Award size={16} style={{ color: '#D4AF37' }} /> Полученные бейджи
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {earnedBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${RARITY_COLORS[badge.rarity]}18` }}>
                        <Award size={14} style={{ color: RARITY_COLORS[badge.rarity] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{badge.name}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{badge.description}</div>
                      </div>
                      <Badge variant={badge.rarity === 'legendary' ? 'leaders' : badge.rarity === 'epic' ? 'engineering' : 'info'} className="text-[10px]">
                        {badge.rarity === 'legendary' ? 'Легендарный' : badge.rarity === 'epic' ? 'Эпический' : badge.rarity === 'rare' ? 'Редкий' : 'Обычный'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Level Perks */}
              <Card padding="lg">
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Бонусы уровня</h3>
                <div className="space-y-2">
                  {levelInfo.perks.length > 0 ? (
                    levelInfo.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Star size={14} style={{ color: levelInfo.tierColor }} /> {perk}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Бонусы начинаются с 5 уровня</p>
                  )}
                </div>
              </Card>

              {/* Leaderboard link */}
              <Card padding="lg" className="cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/gamification/leaderboard')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={18} style={{ color: 'var(--brand-iris)' }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Лидерборд</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Сравните свой прогресс с коллегами</div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </Card>
            </div>
          )}

          {/* Save button (only for profile/security tabs) */}
          {(activeTab === 'profile' || activeTab === 'security') && (
            <div className="flex items-center gap-3 sticky bottom-4 py-3 px-4 rounded-xl border" style={{ backgroundColor: 'var(--iris-bg-surface-elevated)', borderColor: 'var(--iris-border-default)', boxShadow: 'var(--iris-shadow-lg)' }}>
              <Button variant="primary" onClick={handleSave} isLoading={loading} leftIcon={<Save size={16} />} className="shadow-lg">
                Сохранить изменения
              </Button>
              {saved && (
                <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--accent-leaders)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-leaders)' }} /> Сохранено
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Theme Selector Sub-component ─── */
const THEME_OPTIONS: Array<{ id: 'light' | 'dark' | 'sepia' | 'contrast' | 'midnight'; label: string; icon: string; preview: { bg: string; surface: string; text: string; accent: string } }> = [
  { id: 'light', label: 'Светлая', icon: '☀️', preview: { bg: '#F0F2F5', surface: '#FFFFFF', text: '#1E2230', accent: '#0088AA' } },
  { id: 'dark', label: 'Тёмная', icon: '🌙', preview: { bg: '#1E2230', surface: '#2A3042', text: '#E2E8F0', accent: '#00F0FF' } },
  { id: 'sepia', label: 'Сепия', icon: '📜', preview: { bg: '#F4ECD8', surface: '#E8DCC8', text: '#433422', accent: '#8B6914' } },
  { id: 'contrast', label: 'Контрастная', icon: '🔲', preview: { bg: '#000000', surface: '#000000', text: '#FFFFFF', accent: '#00FFFF' } },
  { id: 'midnight', label: 'Полночь', icon: '🌌', preview: { bg: '#0A0E1A', surface: '#111827', text: '#C9D6E3', accent: '#60A5FA' } },
];

function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {THEME_OPTIONS.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className="relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02]"
            style={{
              borderColor: active ? t.preview.accent : 'var(--border-default)',
              backgroundColor: t.preview.surface,
            }}
          >
            {/* Preview window */}
            <div
              className="mb-2 h-12 rounded-lg border p-2 space-y-1.5"
              style={{
                backgroundColor: t.preview.bg,
                borderColor: active ? t.preview.accent : 'rgba(128,128,128,0.2)',
              }}
            >
              <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: t.preview.text, opacity: 0.3 }} />
              <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: t.preview.text, opacity: 0.2 }} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base">{t.icon}</span>
              <span className="text-xs font-medium" style={{ color: t.preview.text }}>{t.label}</span>
            </div>

            {active && (
              <div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ backgroundColor: t.preview.accent, color: t.preview.bg }}
              >
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
