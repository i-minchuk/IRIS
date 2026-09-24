import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardWidget } from './LeaderboardWidget';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/stores/gamificationStore', () => ({
  useGamificationStore: vi.fn((selector: any) => {
    const state = {
      leaderboard: [
        { rank: 1, userId: 1, userName: 'Alice Smith', xp: 5000, level: 5, badges: 3, streak: 10 },
        { rank: 2, userId: 2, userName: 'Bob Jones', xp: 4200, level: 4, badges: 2, streak: 5 },
        { rank: 3, userId: 3, userName: 'Carol White', xp: 3800, level: 4, badges: 2, streak: 3 },
        { rank: 4, userId: 4, userName: 'Dan Brown', xp: 3000, level: 3, badges: 1, streak: 1 },
      ],
      badges: [
        { id: 'b1', name: 'First Doc', rarity: 'common', icon: 'file', earnedAt: '2024-01-01', description: 'd' },
        { id: 'b2', name: 'Reviewer', rarity: 'rare', icon: 'check', earnedAt: '2024-01-02', description: 'd' },
      ],
      fetchAll: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('LeaderboardWidget', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders header and trophy icon', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText('Лидерборд')).toBeInTheDocument();
  });

  it('renders top 3 podium entries', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('renders XP values for top 3', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText(/5\s000/)).toBeInTheDocument();
    expect(screen.getByText(/4\s200/)).toBeInTheDocument();
    expect(screen.getByText(/3\s800/)).toBeInTheDocument();
  });

  it('renders rest entries (rank 4+)', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText('Dan Brown')).toBeInTheDocument();
  });

  it('renders earned badges section', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText('Лучшие практики')).toBeInTheDocument();
    expect(screen.getByText('First Doc')).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
  });

  it('navigates to /team on "Все" click', () => {
    render(<LeaderboardWidget />);
    fireEvent.click(screen.getByText('Все'));
    expect(mockNavigate).toHaveBeenCalledWith('/team');
  });
});
