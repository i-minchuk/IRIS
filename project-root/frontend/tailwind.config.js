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
        /* ── Semantic tokens mapped to CSS variables ── */
        iris: {
          'bg-app': 'var(--iris-bg-app)',
          'bg-surface': 'var(--iris-bg-surface)',
          'bg-surface-elevated': 'var(--iris-bg-surface-elevated)',
          'bg-header': 'var(--iris-bg-header)',
          'bg-card': 'var(--iris-bg-card)',
          'bg-hover': 'var(--iris-bg-hover)',
          'bg-active': 'var(--iris-bg-active)',
          'bg-subtle': 'var(--iris-bg-subtle)',
          'bg-tertiary': 'var(--iris-bg-tertiary)',
          'bg-skeleton': 'var(--iris-bg-skeleton)',
          'bg-backdrop': 'var(--iris-bg-backdrop)',
          'bg-tooltip': 'var(--iris-bg-tooltip)',

          'text-primary': 'var(--iris-text-primary)',
          'text-secondary': 'var(--iris-text-secondary)',
          'text-muted': 'var(--iris-text-muted)',
          'text-inverse': 'var(--iris-text-inverse)',
          'text-on-accent': 'var(--iris-text-on-accent)',

          'border-subtle': 'var(--iris-border-subtle)',
          'border-default': 'var(--iris-border-default)',
          'border-strong': 'var(--iris-border-strong)',
          'border-dashed': 'var(--iris-border-dashed)',

          'accent-cyan': 'var(--iris-accent-cyan)',
          'accent-amber': 'var(--iris-accent-amber)',
          'accent-coral': 'var(--iris-accent-coral)',
          'accent-blue': 'var(--iris-accent-blue)',
          'accent-purple': 'var(--iris-accent-purple)',
          'accent-magenta': 'var(--iris-accent-magenta)',

          'glow-cyan': 'var(--iris-glow-cyan)',
          'glow-amber': 'var(--iris-glow-amber)',
          'glow-coral': 'var(--iris-glow-coral)',
          'glow-blue': 'var(--iris-glow-blue)',
          'glow-purple': 'var(--iris-glow-purple)',
          'glow-magenta': 'var(--iris-glow-magenta)',

          'status-bg-cyan': 'var(--iris-status-bg-cyan)',
          'status-bg-amber': 'var(--iris-status-bg-amber)',
          'status-bg-coral': 'var(--iris-status-bg-coral)',
          'status-bg-blue': 'var(--iris-status-bg-blue)',
          'status-bg-purple': 'var(--iris-status-bg-purple)',
          'status-bg-magenta': 'var(--iris-status-bg-magenta)',
          'status-bg-slate': 'var(--iris-status-bg-slate)',
        },

        /* ── Legacy brand palette (static, for backward compat) ── */
        brand: {
          primary: '#1E2230',
          accent: '#4F7A4C',
          secondary: '#8B9DAF',
          bg: '#F5F7FA',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          error: '#DC2626',
          success: '#16A34A',
          warning: '#F59E0B',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'iris-sm': 'var(--iris-shadow-sm)',
        'iris-md': 'var(--iris-shadow-md)',
        'iris-lg': 'var(--iris-shadow-lg)',
        'iris-xl': 'var(--iris-shadow-xl)',
        'iris-card': 'var(--iris-shadow-card)',
        'iris-tooltip': 'var(--iris-shadow-tooltip)',
        'iris-inset': 'var(--iris-shadow-inset)',
      },
      borderRadius: {
        'iris': '1rem',
        'iris-sm': '0.5rem',
        'iris-md': '0.75rem',
        'iris-lg': '1rem',
        'iris-xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
