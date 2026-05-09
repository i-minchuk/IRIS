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
        },

        /* ── Etalon page colors (hhg4oan5xuxoi.kimi.page) ── */
        page: {
          DEFAULT: '#1a1f3c',
          mid: '#2d3561',
          end: '#1e2749',
        },
        card: {
          DEFAULT: '#2A3042',
          glass: 'rgba(30, 34, 48, 0.6)',
        },
        elevated: '#2F3654',
        primary: {
          DEFAULT: '#4F7A4C',
          dark: '#3D6340',
        },
        secondary: {
          DEFAULT: '#6B5B95',
          light: '#9B8EC7',
        },
        accent: '#D4AF37',
        error: {
          DEFAULT: '#D73A3A',
          light: '#FF6B6B',
        },
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'text-label': '#E2E8F0',
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.2)',
          focus: 'rgba(255, 255, 255, 0.5)',
        },
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
        'neon-green': '0 0 6px rgba(79, 122, 76, 0.4), 0 0 12px rgba(79, 122, 76, 0.2)',
        'neon-purple': '0 0 6px rgba(107, 91, 149, 0.4), 0 0 12px rgba(107, 91, 149, 0.2)',
        'neon-yellow': '0 0 6px rgba(212, 175, 55, 0.4), 0 0 12px rgba(212, 175, 55, 0.2)',
        'neon-blue': '0 0 6px rgba(59, 130, 246, 0.4), 0 0 12px rgba(59, 130, 246, 0.2)',
        'neon-gray': '0 0 6px rgba(107, 114, 128, 0.4), 0 0 12px rgba(107, 114, 128, 0.2)',
        'neon-red': '0 0 6px rgba(255, 107, 107, 0.4), 0 0 12px rgba(255, 107, 107, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'iris': '1rem',
        'iris-sm': '0.5rem',
        'iris-md': '0.75rem',
        'iris-lg': '1rem',
        'iris-xl': '1.5rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1a1f3c 0%, #2d3561 50%, #1e2749 100%)',
      },
    },
  },
  plugins: [],
}