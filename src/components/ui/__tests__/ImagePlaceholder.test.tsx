import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ImagePlaceholder } from '../ImagePlaceholder';
import React from 'react';

// Mock LanguageContext since it's likely used for translations
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key === 'no_image_uploaded' ? 'אין תמונה טעונה' : key,
  }),
}));

describe('ImagePlaceholder', () => {
  it('renders the placeholder with icon and text', () => {
    render(<ImagePlaceholder />);
    
    // Check for the "image" material icon text (since it's a span with the icon name)
    expect(screen.getByText('image')).toBeInTheDocument();
    
    // Check for the Hebrew text
    expect(screen.getByText('אין תמונה טעונה')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ImagePlaceholder className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
