import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials from full name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders first initial for single name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('uppercases initials', () => {
    render(<Avatar name="bob smith" />);
    expect(screen.getByText('BS')).toBeInTheDocument();
  });

  it('limits initials to 2 characters', () => {
    render(<Avatar name="John Paul Jones" />);
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('renders question mark for empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('sets title attribute to full name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByTitle('John Doe')).toBeInTheDocument();
  });

  it('applies size class for sm', () => {
    render(<Avatar name="A" size="sm" />);
    expect(screen.getByText('A')).toHaveClass('w-6');
  });

  it('applies size class for lg', () => {
    render(<Avatar name="A" size="lg" />);
    expect(screen.getByText('A')).toHaveClass('w-10');
  });

  it('applies custom className', () => {
    render(<Avatar name="A" className="my-avatar" />);
    expect(screen.getByText('A')).toHaveClass('my-avatar');
  });
});
