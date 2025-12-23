import { render, screen, fireEvent } from '@testing-library/react';
import { AdminActionButton } from '../AdminActionButton';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('AdminActionButton', () => {
  it('renders children correctly', () => {
    render(<AdminActionButton onClick={() => {}}>Test Button</AdminActionButton>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<AdminActionButton onClick={handleClick}>Click Me</AdminActionButton>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct classes for edit variant', () => {
    render(<AdminActionButton onClick={() => {}} variant="edit">Edit</AdminActionButton>);
    const button = screen.getByText('Edit');
    // Using standard classes from product guidelines
    expect(button).toHaveClass('text-green-600');
  });

  it('applies correct classes for delete variant', () => {
    render(<AdminActionButton onClick={() => {}} variant="delete">Delete</AdminActionButton>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('text-red-600');
  });

  it('meets minimum touch target size of 44px', () => {
    render(<AdminActionButton onClick={() => {}}>Touch Me</AdminActionButton>);
    const button = screen.getByText('Touch Me');
    expect(button).toHaveClass('min-h-[44px]');
    expect(button).toHaveClass('min-w-[44px]');
  });
});
