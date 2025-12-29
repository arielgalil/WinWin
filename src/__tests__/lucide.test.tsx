import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { LayoutDashboard } from 'lucide-react';
import React from 'react';

test('Lucide icons can be rendered', () => {
  const { container } = render(<LayoutDashboard />);
  expect(container.querySelector('svg')).toBeDefined();
  expect(container.querySelector('svg')).toHaveClass('lucide-layout-dashboard');
});
