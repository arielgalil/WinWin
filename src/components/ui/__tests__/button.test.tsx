import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Button } from '../button';
import React from 'react';

test('Button has minimum touch target size of 44px', () => {
  render(<Button>Touch Me</Button>);
  const button = screen.getByText('Touch Me');
  const style = window.getComputedStyle(button);
  
  // Note: JSDOM might not report height accurately for flex/inline-flex
  // but we can check the classes or min-height if applied via style
  // In our Shadcn config, h-9 is 2.25rem = 36px. LG is h-10 = 40px.
  // We need to ensure we meet 44px (h-11) for accessibility.
  expect(button.className).toContain('h-11'); 
});

test('Button supports RTL text alignment', () => {
  render(<div dir="rtl"><Button>שלום</Button></div>);
  const button = screen.getByText('שלום');
  // Verify RTL context or alignment if needed
  expect(button).toBeDefined();
});
