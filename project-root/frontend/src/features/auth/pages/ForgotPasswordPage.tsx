import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSent(true);
      if (result.reset_token) {
        setDemoToken(result.reset_token);
        toast.success('Токен сброса получен (демо-режим)');
      } else {
        toast.success('Инструкции отправлены на email');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка запроса сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Сброс пароля</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Введите email, и мы отправим инструкции по сбросу пароля
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Email адрес
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@domain.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Отправка...' : 'Отправить инструкции'}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="text-green-600 dark:text-green-400 font-medium">
                ✓ Запрос отправлен
              </div>
              {demoToken && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-left">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                    Демо-режим: токен сброса
                  </p>
                  <code className="text-xs break-all text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded block">
                    {demoToken}
                  </code>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    В production этот токен будет отправлен на email.{' '}
                    <Link to={`/reset-password?token=${encodeURIComponent(demoToken)}`} className="underline">
                      Перейти к сбросу →
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              ← Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
