import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Card, CardHeader, CardTitle, CardContent } from '../card';
import { Badge } from '../badge';
import { Separator } from '../separator';
import React from 'react';

test('Surface components render correctly', () => {
  render(
    <Card>
      <CardHeader>
        <CardTitle>Surface Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge>New</Badge>
        <Separator className="my-4" />
        <p>Content</p>
      </CardContent>
    </Card>
  );
  
  expect(screen.getByText('Surface Card')).toBeDefined();
  expect(screen.getByText('New')).toBeDefined();
  expect(screen.getByText('Content')).toBeDefined();
});

test('Card supports infused prop for brand tint', () => {
    render(<Card infused>Infused Card</Card>);
    const card = screen.getByText('Infused Card');
    expect(card.className).toContain('bg-accent/5');
    expect(card.className).toContain('border-accent/20');
});
