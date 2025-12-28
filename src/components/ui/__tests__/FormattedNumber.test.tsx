import { render, screen } from '@testing-library/react';
import { FormattedNumber } from '../FormattedNumber';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('FormattedNumber Component', () => {
  it('renders a positive number correctly', () => {
    render(<FormattedNumber value={5765} />);
    const el = screen.getByText('5,765');
    expect(el).toBeDefined();
    expect(el.getAttribute('dir')).toBe('ltr');
  });

  it('renders a negative number with prefix minus', () => {
    render(<FormattedNumber value={-100} />);
    const el = screen.getByText('-100');
    expect(el).toBeDefined();
    expect(el.textContent).toBe('-100');
    expect(el.getAttribute('dir')).toBe('ltr');
  });

  it('renders a positive number with prefix plus when forceSign is true', () => {
    render(<FormattedNumber value={50} forceSign={true} />);
    const el = screen.getByText('+50');
    expect(el).toBeDefined();
    expect(el.textContent).toBe('+50');
    expect(el.getAttribute('dir')).toBe('ltr');
  });
});
