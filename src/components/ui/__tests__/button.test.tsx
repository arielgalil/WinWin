import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Button } from '../button';
import React from 'react';

test('Shadcn Button is available and can be rendered', () => {
  render(<Button>Test Button</Button>);
  expect(screen.getByText('Test Button')).toBeDefined();
});