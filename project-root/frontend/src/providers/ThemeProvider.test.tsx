import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme, applyThemeToDOM } from '../providers/ThemeProvider';
import type { Theme } from '../providers/ThemeProvider';

function TestComponent() {
  const { theme, setTheme, cycleTheme, themeIcon, themeLabel } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="icon">{themeIcon}</div>
      <div data-testid="label">{themeLabel}</div>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={cycleTheme}>Cycle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('iris-theme', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('falls back to system preference when no localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    const theme = screen.getByTestId('theme').textContent as Theme;
    expect(['light', 'dark']).toContain(theme);
  });

  it('setTheme updates state and DOM', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('iris-theme')).toBe('dark');
  });

  it('cycleTheme rotates through all themes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    const expectedOrder: Theme[] = ['light', 'dark', 'contrast', 'sepia', 'midnight'];
    const startIdx = expectedOrder.indexOf(screen.getByTestId('theme').textContent as Theme);

    for (let i = 1; i <= 5; i++) {
      fireEvent.click(screen.getByText('Cycle'));
      const expected = expectedOrder[(startIdx + i) % expectedOrder.length];
      expect(screen.getByTestId('theme').textContent).toBe(expected);
    }
  });

  it('provides correct icon and label for each theme', () => {
    localStorage.setItem('iris-theme', 'sepia');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('icon').textContent).toBe('📜');
    expect(screen.getByTestId('label').textContent).toBe('Сепия');
  });

  it('applyThemeToDOM adds dark class for dark/midnight/contrast', () => {
    applyThemeToDOM('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    applyThemeToDOM('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyThemeToDOM('midnight');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyThemeToDOM('contrast');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyThemeToDOM('sepia');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('skips DOM update on /login page', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login' },
      writable: true,
    });
    localStorage.setItem('iris-theme', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    // На странице логина theme не применяется к DOM
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});
