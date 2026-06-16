import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, QrCode, Trash2, Check } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import apiClient from '@/shared/api/client';
import { useAuth } from '@/context/useAuth';

interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
}

export default function TwoFactorSettingsPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');

  const handleSetup = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
      setSetupData(data);
      setStep('setup');
      toast.success('QR-код сгенерирован. Отсканируйте его в приложении-аутентификаторе.');
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Не удалось начать настройку 2FA';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!verifyToken || verifyToken.length < 6) {
      toast.error('Введите 6-значный код');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/2fa/verify', null, { params: { token: verifyToken } });
      toast.success('Двухфакторная аутентификация включена');
      setStep('idle');
      setSetupData(null);
      setVerifyToken('');
      refreshUser?.();
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Неверный код подтверждения';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [verifyToken, refreshUser]);

  const handleDisable = useCallback(async () => {
    if (!disableToken || disableToken.length < 6) {
      toast.error('Введите 6-значный код для отключения');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/2fa/disable', null, { params: { token: disableToken } });
      toast.success('Двухфакторная аутентификация отключена');
      setDisableToken('');
      refreshUser?.();
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Неверный код';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [disableToken, refreshUser]);

  return (
    <div className="w-full pt-2 pb-6 px-4">
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
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
          Двухфакторная аутентификация
        </h1>
      </div>

      <div className="space-y-6">
        {/* Status */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} style={{ color: user?.totp_enabled ? 'var(--accent-leaders)' : 'var(--text-secondary)' }} />
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Статус 2FA
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {user?.totp_enabled
                  ? 'Двухфакторная аутентификация активна'
                  : 'Двухфакторная аутентификация отключена'}
              </p>
            </div>
          </div>

          {!user?.totp_enabled && step === 'idle' && (
            <Button variant="primary" onClick={handleSetup} isLoading={loading} leftIcon={<QrCode size={16} />}>
              Настроить 2FA
            </Button>
          )}
        </Card>

        {/* Setup flow */}
        {step === 'setup' && setupData && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Настройка аутентификатора
            </h2>

            <div className="flex flex-col items-center gap-4">
              <img
                src={setupData.qr_code}
                alt="QR-код для настройки 2FA"
                className="w-48 h-48 rounded-lg border"
                style={{ borderColor: 'var(--iris-border-default)' }}
              />
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                Отсканируйте QR-код в приложении Google Authenticator, Authy или аналогичном.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Секретный ключ (для ручного ввода)
              </label>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 px-3 py-2 rounded text-sm break-all"
                  style={{
                    backgroundColor: 'var(--iris-bg-hover)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {setupData.secret}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Код подтверждения
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                Введите 6-значный код из приложения-аутентификатора для подтверждения.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={handleVerify} isLoading={loading} leftIcon={<Check size={16} />}>
                Подтвердить и включить
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('idle');
                  setSetupData(null);
                  setVerifyToken('');
                }}
              >
                Отмена
              </Button>
            </div>
          </Card>
        )}

        {/* Disable flow */}
        {user?.totp_enabled && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Отключить 2FA
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Для отключения введите текущий код из приложения-аутентификатора.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Код из аутентификатора
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <Button variant="danger" onClick={handleDisable} isLoading={loading} leftIcon={<Trash2 size={16} />}>
              Отключить 2FA
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
