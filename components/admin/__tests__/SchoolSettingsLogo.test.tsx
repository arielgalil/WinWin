import { render, screen } from '@testing-library/react';
import { SchoolSettings } from '../SchoolSettings';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';

// Mock dependencies
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'he', dir: 'rtl' })
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

vi.mock('../../../hooks/useConfirmation', () => ({
  useConfirmation: () => ({
    modalConfig: { isOpen: false },
    openConfirmation: vi.fn(),
    closeConfirmation: vi.fn(),
  })
}));

vi.mock('../../../supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({ data: { publicUrl: 'test.png' } })
      })
    },
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null })
    })
  }
}));

const mockSettings = {
  campaign_id: 'test-camp',
  school_name: 'Test School',
  logo_url: 'test-logo.png',
};

describe('SchoolSettings Logo Preview', () => {
  it('renders logo preview with circular styling (rounded-full)', () => {
    const { container } = render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <SchoolSettings settings={mockSettings as any} totalScore={100} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );

    // Find the image container
    const img = screen.getByAltText('Preview');
    const containerDiv = img.closest('div');
    
    // According to spec, it should be circular (rounded-full)
    expect(containerDiv?.className).toContain('rounded-full');
  });
});
