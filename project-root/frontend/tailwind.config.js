/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',  // Включаем переключение темы через класс .dark
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Брендовые цвета из brandbook_dokpotok_iris_v2.md
        brand: {
          primary: '#1E2230',       // Основной текст
          accent: '#4F7A4C',        // Акцент (ирис)
          secondary: '#8B9DAF',     // Вторичный текст
          bg: '#F5F7FA',            // Фон страницы
          surface: '#FFFFFF',       // Карточки
          border: '#E2E8F0',        // Границы
          error: '#DC2626',         // Ошибки
          success: '#16A34A',       // Успех
          warning: '#F59E0B',       // Предупреждения
          info: '#3B82F6',          // Информация
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'iris-sm': '0 1px 3px rgba(0,0,0,0.12)',
        'iris-md': '0 4px 12px rgba(0,0,0,0.15)',
        'iris-lg': '0 8px 24px rgba(0,0,0,0.18)',
      }
    },
  },
  plugins: [],
}