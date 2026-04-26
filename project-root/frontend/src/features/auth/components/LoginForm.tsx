// frontend/src/features/auth/components/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export const LoginForm: React.FC = () => {
  const [loginType, setLoginType] = useState<'email' | 'username'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loginData = loginType === 'email' 
        ? { email, password }
        : { username, password };
      
      const tokenResponse = await authApi.login(loginData);
      
      // Сохраняем токены
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      
      // Создаём минимальный объект пользователя из токена
      const user = {
        id: 1,
        email: loginType === 'email' ? email : `${username}@local`,
        full_name: 'User',
        is_active: true,
      };
      
      setAuth(user, tokenResponse.access_token);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Логотип с иконкой */}
          <div className="flex justify-center mb-4">
            <img
              src="/icons/logo-light.svg"
              alt="ДокПоток IRIS"
              className="h-16 w-16 dark:hidden"
            />
            <img
              src="/icons/logo-dark.svg"
              alt="ДокПоток IRIS"
              className="h-16 w-16 hidden dark:block"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            DokPotok IRIS
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Система управления инженерной документацией
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
            Вход в систему
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Переключатель типа входа */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'email'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType('username')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'username'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Логин
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginType === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Email адрес
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@domain.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Логин
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="username"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>

        {/* Test credentials hint */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
          <p>Тестовый вход:</p>
          <p className="mt-1">Email: admin@iris.com</p>
          <p>Пароль: admin123</p>
          <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            Примечание: Вход по логину требует username в базе данных
          </p>
        </div>
      </div>
    </div>
  );
};
