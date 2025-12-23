import { render, screen } from '@testing-library/react';
import { AdminRowActions } from '../AdminRowActions';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('AdminRowActions', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onSecondary = vi.fn();

  it('renders buttons in correct RTL order (Delete right-most)', () => {
    // In LTR DOM (which is how we code), right-most in RTL means first in source order if flex-row is used without direction reverse, 
    // OR last in source order if flex-row-reverse is used. 
    // Assuming standard flex-row with parent dir="rtl" context or just visual ordering:
    // We want visually: [Delete] [Secondary] [Edit] (from Right to Left)
    // In DOM source for standard flex row: <Delete> <Secondary> <Edit>
    
    const { container } = render(
      <AdminRowActions 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onSecondary={onSecondary}
        secondaryIcon={<span data-testid="sec-icon" />}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    
    // First button (Right-most in RTL) should be Delete (Red)
    expect(buttons[0]).toHaveAttribute('title', 'delete'); // Assuming we use translation keys or titles
    expect(buttons[0].className).toContain('bg-red-50');

    // Middle button should be Secondary
    expect(buttons[1]).toHaveAttribute('title', 'secondary');
    
    // Last button (Left-most in RTL) should be Edit (Green)
    expect(buttons[2]).toHaveAttribute('title', 'edit');
    expect(buttons[2].className).toContain('bg-green-50');
  });

  it('renders only provided actions', () => {
    const { container } = render(
      <AdminRowActions onEdit={onEdit} />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('title', 'edit');
  });
});
