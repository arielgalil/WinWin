import React from 'react';
import { render, screen } from '@testing-library/react';
import { LeaderIcon } from '../LeaderIcon';
import { describe, it, expect, vi } from 'vitest';

describe('LeaderIcon', () => {
  it('renders the crown icon inside a circle container', () => {
    render(<LeaderIcon />);
    
    // Check for the icon name text (Material Icons render the name)
    expect(screen.getByText('crown')).toBeInTheDocument();
    
    // Check for the circle container
    const circle = screen.getByTestId('leader-icon-circle');
    expect(circle).toHaveClass('rounded-full');
    expect(circle).toHaveClass('bg-yellow-500/20');
  });

  it('renders default md size classes', () => {
    render(<LeaderIcon size="md" />);
    const container = screen.getByTestId('leader-icon-container');
    expect(container).toHaveClass('w-12');
    expect(container).toHaveClass('md:w-16');
  });

  it('renders lg size classes', () => {
    render(<LeaderIcon size="lg" />);
    const container = screen.getByTestId('leader-icon-container');
    expect(container).toHaveClass('w-20');
    expect(container).toHaveClass('h-20');
  });

  it('accepts custom className', () => {
    render(<LeaderIcon className="custom-class" />);
    const container = screen.getByTestId('leader-icon-container');
    expect(container).toHaveClass('custom-class');
  });
});
