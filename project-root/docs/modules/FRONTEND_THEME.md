# Модуль: Frontend Theme & Styling

## Назначение
Двойная тема (светлая/тёмная), Tailwind CSS, дизайн-система IRIS.

## Файлы
```
frontend/src/shared/styles/globals.css   # Актуальная дизайн-система
frontend/src/index.css                    # Legacy neon-стили
frontend/src/providers/ThemeProvider.tsx  # Theme Context
frontend/tailwind.config.js               # Tailwind config
```

## Дизайн-система (globals.css)
CSS-переменные под `:root`/`.theme-light` и `.theme-dark`/`.dark`:
- `--iris-bg-app`, `--iris-bg-surface`, `--iris-bg-hover`
- `--iris-text-primary`, `--iris-text-secondary`, `--iris-text-muted`
- `--iris-border-default`, `--iris-border-subtle`
- `--iris-accent-blue`, `--iris-accent-green`, `--iris-accent-gold`, `--iris-accent-purple`
- `--iris-shadow-sm`, `--iris-shadow-md`, `--iris-shadow-lg`

## Legacy bridge variables
Используются текущими компонентами:
- `--layout-bg`, `--header-bg`, `--header-border`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--card-bg`, `--border-color`

## ThemeProvider
- React Context: `'light' | 'dark'`
- Читает `localStorage('iris-theme')` и `prefers-color-scheme`
- Устанавливает `data-theme` и класс `.dark` на `<html>`
- Tailwind: `darkMode: 'class'`

## Цветовая схема
- **Emerald/Green**: `#0C7205` — engineering акцент
- **Blue**: `#3B82F6` — primary, links
- **Gold**: `#D4AF37` / `#E8C44A` — тендеры, акценты
- **Purple**: `#8B5CF6` — проекты
- **Red**: `#FF6B6B` — ошибки, критические замечания

## Правила параллельной разработки
- **Использовать** `globals.css` переменные, **не хардкодить** цвета
- Для Tailwind: `style={{ color: 'var(--text-primary)' }}` или классы
- Legacy `index.css` — постепенно мигрируем на `globals.css`
- Тема переключается мгновенно, transition `0.5s ease-out`
