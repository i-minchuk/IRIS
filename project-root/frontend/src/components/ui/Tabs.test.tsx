import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from './Tabs';

const tabs = [
  { label: 'Tab 1', content: <div>Content 1</div> },
  { label: 'Tab 2', content: <div>Content 2</div> },
  { label: 'Tab 3', content: <div>Content 3</div> },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('respects initialTab prop', () => {
    render(<Tabs tabs={tabs} initialTab="Tab 2" />);
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('switches content on tab click', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('applies aria-current to active tab', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Tab 1').closest('button')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Tab 2').closest('button')).not.toHaveAttribute('aria-current');
  });

  it('renders nav with aria-label', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('navigation', { name: 'Tabs' })).toBeInTheDocument();
  });
});
