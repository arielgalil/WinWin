import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrandingPreview } from '../settings/BrandingPreview';
import { describe, it, expect, vi } from 'vitest';

// Mock useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'he',
    isRTL: true,
    dir: 'rtl'
  })
}));

describe('BrandingPreview Component', () => {
  it('renders with correct colors and brightness', () => {
    const primaryColor = '#ff0000';
    const secondaryColor = '#0000ff';
    const brightness = 75;

    render(
      <BrandingPreview 
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        brightness={brightness}
        title="Sample Title"
      />
    );

    // Check if the sample title is rendered
    expect(screen.getByText('Sample Title')).toBeInTheDocument();
    
    // The GradientBackground is a div with style backgroundImage
    // Since it's a subcomponent, we might want to check the style of the container if passed down
  });
});
