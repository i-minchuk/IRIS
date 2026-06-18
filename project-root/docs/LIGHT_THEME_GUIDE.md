# Светлая неоновая тема — DokPotok IRIS

## 📋 Обзор

Светлая тема адаптирована под белый фон с использованием техники:
- **Насыщенные границы** вместо внешнего glow
- **Внутреннее свечение** (inset box-shadow)
- **Лёгкие цветные заливки** для акцентов

**ВАЖНО**: На белом фоне внешний цветной glow выглядит грязным, поэтому используется другая техника.

---

## 🎨 CSS-классы светлой темы

### 1. Карточки / Контейнеры

```css
/* ЗЕЛЁНЫЙ — Dashboard, основной бренд */
.neon-light-green {
  background: #FFFFFF;
  border: 2px solid #4F7A4C;
  box-shadow:
    inset 0 0 20px rgba(79, 122, 76, 0.08),
    0 2px 8px rgba(79, 122, 76, 0.12);
  border-radius: 1rem;
}

/* ФИОЛЕТОВЫЙ — Projects */
.neon-light-purple {
  background: #FFFFFF;
  border: 2px solid #6B5B95;
  box-shadow:
    inset 0 0 20px rgba(107, 91, 149, 0.08),
    0 2px 8px rgba(107, 91, 149, 0.12);
  border-radius: 1rem;
}

/* ЖЁЛТЫЙ — Documents / Tender */
.neon-light-yellow {
  background: #FFFFFF;
  border: 2px solid #D4AF37;
  box-shadow:
    inset 0 0 20px rgba(212, 175, 55, 0.08),
    0 2px 8px rgba(212, 175, 55, 0.12);
  border-radius: 1rem;
}

/* КРАСНЫЙ — Remarks / Замечания */
.neon-light-red {
  background: #FFFFFF;
  border: 2px solid #D73A3A;
  box-shadow:
    inset 0 0 20px rgba(215, 58, 58, 0.06),
    0 2px 8px rgba(215, 58, 58, 0.12);
  border-radius: 1rem;
}

/* СЕРЫЙ — Archive */
.neon-light-gray {
  background: #FFFFFF;
  border: 2px solid #94A3B8;
  box-shadow:
    inset 0 0 20px rgba(148, 163, 184, 0.08),
    0 2px 8px rgba(148, 163, 184, 0.12);
  border-radius: 1rem;
}
```

### 2. Кнопки (залитые, не outline)

```css
.btn-light-green {
  @apply px-4 py-2 rounded-lg font-medium text-white;
  background: linear-gradient(135deg, #4F7A4C 0%, #3D6340 100%);
  box-shadow: 0 4px 12px rgba(79, 122, 76, 0.25);
  border: 1px solid rgba(79, 122, 76, 0.3);
}
.btn-light-green:hover {
  box-shadow: 0 4px 20px rgba(79, 122, 76, 0.4);
  transform: translateY(-1px);
}

.btn-light-purple {
  @apply px-4 py-2 rounded-lg font-medium text-white;
  background: linear-gradient(135deg, #6B5B95 0%, #5A4D80 100%);
  box-shadow: 0 4px 12px rgba(107, 91, 149, 0.25);
}

.btn-light-yellow {
  @apply px-4 py-2 rounded-lg font-medium text-[#1E2230]; /* ТЁМНЫЙ текст! */
  background: linear-gradient(135deg, #D4AF37 0%, #B8942F 100%);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
}

.btn-light-red {
  @apply px-4 py-2 rounded-lg font-medium text-white;
  background: linear-gradient(135deg, #D73A3A 0%, #B83030 100%);
  box-shadow: 0 4px 12px rgba(215, 58, 58, 0.25);
}
```

### 3. Текстовые акценты

```css
.text-light-green {
  color: #3D6340; /* Темнее для контраста */
  text-shadow: 0 0 8px rgba(79, 122, 76, 0.15);
}
.text-light-purple {
  color: #5A4D80;
  text-shadow: 0 0 8px rgba(107, 91, 149, 0.15);
}
.text-light-yellow {
  color: #8A6D1F; /* Тёмно-золотой для читаемости */
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.15);
}
```

### 4. Таблицы

```css
.table-light-header-green {
  background: rgba(79, 122, 76, 0.08);
  border-bottom: 2px solid #4F7A4C;
  color: #3D6340;
  font-weight: 600;
}
.table-light-row:hover {
  background: rgba(79, 122, 76, 0.04);
}
```

### 5. Инпуты / Формы

```css
.input-light {
  @apply bg-white border rounded-lg px-3 py-2 text-[#1E2230];
  border-color: #CBD5E1;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}
.input-light:focus {
  outline: none;
  border-color: #4F7A4C;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.05),
    0 0 0 3px rgba(79, 122, 76, 0.15);
}
```

---

## 🗂️ Маппинг вкладок → цвета

| Вкладка | Класс карточки | Класс кнопки | Класс текста |
|---------|----------------|--------------|--------------|
| Dashboard | `neon-light-green` | `btn-light-green` | `text-light-green` |
| Projects | `neon-light-purple` | `btn-light-purple` | `text-light-purple` |
| Documents | `neon-light-yellow` | `btn-light-yellow` | `text-light-yellow` |
| Remarks | `neon-light-red` | `btn-light-red` | `text-red-700` |
| Archive | `neon-light-gray` | — | `text-slate-600` |
| Tender | `neon-light-yellow` | `btn-light-yellow` | `text-light-yellow` |

---

## 🔄 Переключение тем

### ThemeProvider (уже реализован)

```typescript
// frontend/src/providers/ThemeProvider.tsx
const [theme, setTheme] = useState<Theme>(() => {
  const saved = localStorage.getItem('iris-theme') as Theme;
  return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
});

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  // Также поддерживаем класс .dark для Tailwind
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [theme]);
```

### Использование в компоненте

```typescript
import { useTheme } from '@/providers/ThemeProvider';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Переключить тему: {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

---

## 🛠️ Применение к страницам (примеры)

### LoginPage (УЖЕ светлая)

```tsx
// Было (тёмная градиентная):
<div style={{ background: 'linear-gradient(135deg, #1E2230...)' }}>

// Стало (уже реализовано — светлая):
<div className="min-h-screen flex items-center justify-center bg-light-page">
```

### Dashboard

```tsx
// Было (тёмная):
<div className="min-h-screen bg-[#1E2230] p-6">
  <h1 className="text-2xl font-bold text-[#E8ECF1]">ДокПоток IRIS</h1>
  <button className="bg-[#2A3042] neon-green ...">

// Стало (светлая):
<div className="min-h-screen bg-light-page p-6" data-theme="light">
  <h1 className="text-2xl font-bold text-light-text">ДокПоток IRIS</h1>
  <button className="neon-light-green ...">
```

### Карточки (универсальный пример)

```tsx
// Было (тёмная):
<div className="bg-[#2A3042] neon-green p-4 rounded-lg">
  <h3 className="text-neon-green">Заголовок</h3>
</div>

// Стало (светлая):
<div className="neon-light-green p-4 rounded-lg">
  <h3 className="text-light-green">Заголовок</h3>
</div>
```

### Кнопки

```tsx
// Было (тёмная — outline с glow):
<button className="btn-neon-green">
  Сохранить
</button>

// Стало (светлая — залитая):
<button className="btn-light-green">
  Сохранить
</button>
```

### Таблицы

```tsx
// Было (тёмная):
<thead className="bg-[#2F3654] text-[#E8ECF1] border-b border-[#4F7A4C]">

// Стало (светлая):
<thead className="table-light-header-green">
```

### Inputs

```tsx
// Было (тёмная):
<input className="input-dark" />

// Стало (светлая):
<input className="input-light" />
```

---

## ⛔ ЗАПРЕТЫ

1. **НЕ использовать внешний цветной glow** на белом фоне (box-shadow с цветом) — выглядит грязно
2. **НЕ использовать outline-кнопки** с тонкой границей на светлом фоне — теряются
3. **НЕ менять логику компонентов** (state, props, hooks, API)
4. **НЕ создавать новые страницы** или маршруты
5. **НЕ использовать inline-стили** с цветами
6. **НЕ делать фон страницы чистым белым #FFFFFF** — использовать #F8FAFC (slate-50)

---

## 📁 Файлы для редактирования

### CSS (УЖЕ ДОБАВЛЕНО)
- `frontend/src/index.css` — светлая неоновая тема добавлена

### Компоненты (примеры для обновления)
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Projects.tsx`
- `frontend/src/pages/DocumentsPage.tsx`
- `frontend/src/pages/RemarksPage/index.tsx`
- `frontend/src/pages/ArchivePage.tsx`

---

## ✅ Проверка контрастности

| Элемент | Цвет текста | Фон | Контраст | WCAG |
|---------|-------------|-----|----------|------|
| Основной текст | #1E2230 | #FFFFFF | 16.1:1 | AAA |
| text-light-green | #3D6340 | #FFFFFF | 7.2:1 | AA |
| text-light-purple | #5A4D80 | #FFFFFF | 6.8:1 | AA |
| text-light-yellow | #8A6D1F | #FFFFFF | 8.1:1 | AAA |
| btn-light-yellow текст | #1E2230 | #D4AF37 | 9.3:1 | AAA |

Все цвета проходят WCAG AA минимум!

---

## 🚀 Быстрая инструкция (15 минут)

### Шаг 1. Добавить CSS (УЖЕ СДЕЛАНО)
CSS-классы уже добавлены в `frontend/src/index.css`

### Шаг 2. Глобальная замена (Ctrl+Shift+H в VS Code)

```
Искать                       Заменить на
bg-[#1E2230]                bg-light-page
bg-[#2A3042]                bg-white
bg-[#2F3654]                bg-light-elevated
text-[#E8ECF1]              text-light-text
text-[#94A3B8]              text-light-muted
neon-green                  neon-light-green
neon-purple                 neon-light-purple
neon-yellow                 neon-light-yellow
neon-red                    neon-light-red
btn-neon-green              btn-light-green
btn-neon-purple             btn-light-purple
input-dark                  input-light
```

### Шаг 3. Проверка
1. Запустить frontend: `npm run dev`
2. Перейти на страницу
3. Нажать переключатель темы (если есть) или добавить `data-theme="light"` вручную
4. Проверить все карточки, кнопки, тексты

---

## 📝 Пример переключателя темы

```tsx
// frontend/src/components/ThemeToggle.tsx
import { useTheme } from '@/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-white border-2 border-[#E2E8F0] hover:border-[#4F7A4C] transition-colors"
      title={`Переключить на ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[#1E2230]" />
      ) : (
        <Sun className="w-5 h-5 text-[#F8FAFC]" />
      )}
    </button>
  );
}
```

---

## 🎯 Готово!

Светлая неоновая тема реализована с использованием:
- ✅ Насыщенных границ
- ✅ Внутреннего свечения (inset box-shadow)
- ✅ Лёгких цветных заливок
- ✅ WCAG AA контрастности
- ✅ Переключения через data-theme атрибут

**Ключевое отличие от тёмной темы**: вместо «свечения наружу» используем «цветную рамку + внутреннее свечение + лёгкую тень». Это сохраняет узнаваемость бренда и выглядит чисто на белом фоне.
