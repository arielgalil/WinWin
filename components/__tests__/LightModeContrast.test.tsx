import { render, screen } from '@testing-library/react';
import { AdminSectionCard } from '../ui/AdminSectionCard';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

describe('Light Mode Contrast Audit', () => {
  beforeEach(() => {
    // Reset document classes
    document.documentElement.className = '';
    document.body.className = '';
  });

  it('verifies that AdminSectionCard uses correct semantic variables', () => {
    // We add 'light' class to body to simulate light mode
    document.body.classList.add('light');
    
    render(
      <AdminSectionCard 
        title="Test Title"
        description="Test Description"
      >
        <div>Content</div>
      </AdminSectionCard>
    );

    const title = screen.getByText('Test Title');
    const desc = screen.getByText('Test Description');
    
    // Check classes
    expect(title.className).toContain('text-[var(--text-main)]');
    expect(desc.className).toContain('text-[var(--text-secondary)]');
  });
});
