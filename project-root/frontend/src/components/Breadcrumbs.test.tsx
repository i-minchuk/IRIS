import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

function renderWithRouter(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumbs />
    </MemoryRouter>
  );
}

describe('Breadcrumbs', () => {
  it('returns null on root path', () => {
    const { container } = renderWithRouter('/');
    expect(container.firstChild).toBeNull();
  });

  it('returns null on single-segment path', () => {
    const { container } = renderWithRouter('/dashboard');
    expect(container.firstChild).toBeNull();
  });

  it('renders home link', () => {
    renderWithRouter('/documents/123');
    expect(screen.getByTitle('Главная')).toBeInTheDocument();
  });

  it('renders breadcrumb for known route label', () => {
    renderWithRouter('/documents/123');
    expect(screen.getByText('Документация')).toBeInTheDocument();
  });

  it('renders breadcrumb for nested known route', () => {
    renderWithRouter('/documents/archive/list');
    expect(screen.getByText('Документация')).toBeInTheDocument();
    expect(screen.getByText('Архив')).toBeInTheDocument();
  });

  it('formats unknown segment labels', () => {
    renderWithRouter('/some-custom-page/detail');
    expect(screen.getByText('Some Custom Page')).toBeInTheDocument();
  });

  it('excludes last segment', () => {
    renderWithRouter('/documents/123');
    expect(screen.queryByText('123')).not.toBeInTheDocument();
  });

  it('renders links with correct hrefs', () => {
    renderWithRouter('/documents/archive');
    const link = screen.getByText('Документация');
    expect(link.closest('a')).toHaveAttribute('href', '/documents');
  });

  it('has correct aria-label', () => {
    renderWithRouter('/documents/123');
    expect(screen.getByLabelText('Хлебные крошки')).toBeInTheDocument();
  });
});
