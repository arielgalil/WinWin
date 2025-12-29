import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Sidebar } from '../sidebar';
import React from 'react';

test('Sidebar opens and positions correctly in RTL mode', () => {
  render(<Sidebar direction="rtl" />);
  
  // Open the sidebar
  const triggerButton = screen.getByRole('button', { name: 'Open sidebar' });
  fireEvent.click(triggerButton);

  const sidebar = screen.getByRole('dialog');
  expect(sidebar).toBeDefined();
  
  // In RTL, the sidebar should be on the right.
  // Check if the SheetContent has the right positioning classes.
  expect(sidebar.className).toContain('!inset-y-0');
  expect(sidebar.className).toContain('!left-auto');
  expect(sidebar.className).toContain('!right-0');
});
