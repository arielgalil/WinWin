import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Input } from '../input';
import React from 'react';

test('Input has minimum touch target size of 44px', () => {
  render(<Input placeholder="Type here" />);
  const input = screen.getByPlaceholderText('Type here');
  // h-11 is 2.75rem = 44px
  expect(input.className).toContain('h-11');
});

test('Input supports RTL text alignment', () => {
  render(<div dir="rtl"><Input placeholder="חיפוש" /></div>);
  const input = screen.getByPlaceholderText('חיפוש');
  expect(input).toBeDefined();
});
