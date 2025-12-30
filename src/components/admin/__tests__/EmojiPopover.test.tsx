import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoalsManager } from '../settings/GoalsManager';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';
import { ToastProvider } from '../../../hooks/useToast';
import { describe, it, expect, vi } from 'vitest';
import { AppSettings, CompetitionGoal } from '../../../types';

// Mock useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string, params?: any) => {
        if (key === 'stage_label') return `Stage ${params?.index}`;
        return key;
    },
    language: 'he',
    isRTL: true,
    dir: 'rtl'
  })
}));

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'admin' },
    logout: vi.fn()
  })
}));

// Mock useCampaign
vi.mock('../../../hooks/useCampaign', () => ({
  useCampaign: () => ({
    campaignId: 'test-campaign',
    campaign: { id: 'test-campaign' }
  })
}));

// Mock useCampaignRole
vi.mock('../../../hooks/useCampaignRole', () => ({
  useCampaignRole: () => ({
    campaignRole: 'admin'
  })
}));

const mockSettings: AppSettings = {
    school_name: 'Test School',
    competition_name: 'Test Comp',
    logo_url: null,
    goals_config: [],
    campaign_id: 'camp-1'
};

const renderWithContext = (ui: React.ReactNode) => {
  return render(
    <ToastProvider>
      <SaveNotificationProvider>
        {ui}
      </SaveNotificationProvider>
    </ToastProvider>
  );
};

describe('Emoji Selection Popover', () => {
  it('opens popover when insert_emoji is clicked instead of modal', async () => {
    renderWithContext(
      <GoalsManager 
        settings={mockSettings} 
        onUpdateSettings={async () => {}} 
        totalScore={0} 
      />
    );
    
    // Find the insert emoji button
    const insertEmojiBtn = screen.getByText('insert_emoji').closest('button');
    if (!insertEmojiBtn) throw new Error('Button not found');
    fireEvent.click(insertEmojiBtn);

    // If it's a popover, the old modal title should NOT exist in the DOM initially
    // as a fixed modal.
    // Instead, we should find the popover content after clicking
    const popoverContent = await screen.findByText('prize_emoji_selection');
    
    expect(popoverContent).toBeInTheDocument();
    
    // Check that it's not a full-screen fixed modal by checking its parent or structure
    // Radix PopoverContent usually has data-state attribute
    expect(popoverContent.closest('[data-state]')).toBeInTheDocument();
  });
});
