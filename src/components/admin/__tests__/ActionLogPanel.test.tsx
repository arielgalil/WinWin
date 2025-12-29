// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(function () { // Use a function to simulate a constructor
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionLogPanel } from '../ActionLogPanel';
import { AppSettings, ActionLog } from '../../../types';
import * as geminiService from '../../../services/geminiService';
import * as useLanguageHook from '../../../hooks/useLanguage';

// Mock the generateAdminSummary function
vi.mock('../../../services/geminiService', () => ({
  generateAdminSummary: vi.fn(),
}));

// Mock useLanguage hook
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: vi.fn(),
}));

// Mock useConfirmation hook
vi.mock('../../../hooks/useConfirmation', () => ({
  useConfirmation: () => ({
    modalConfig: { isOpen: false },
    openConfirmation: vi.fn(),
  }),
}));

// Mock useSaveNotification hook
vi.mock('../../../contexts/SaveNotificationContext', () => ({
  useSaveNotification: () => ({
    triggerSave: vi.fn(),
  }),
}));

const mockLogs: ActionLog[] = [
  { id: '1', created_at: '2023-01-01T10:00:00Z', description: 'Log 1', points: 10, teacher_name: 'Teacher 1', campaign_id: 'camp1' },
  { id: '2', created_at: '2023-01-01T11:00:00Z', description: 'Log 2', points: 20, teacher_name: 'Teacher 2', campaign_id: 'camp1' },
];

const mockSettings: AppSettings = {
  school_name: 'Test School',
  competition_name: 'Test Comp',
  logo_url: null,
  ai_summary: null,
  ai_summary_updated_at: null,
};

describe('ActionLogPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useLanguageHook.useLanguage as vi.Mock).mockReturnValue({ t: (key: string) => key, language: 'en', isRTL: false });
    (geminiService.generateAdminSummary as vi.Mock).mockResolvedValue('Generated AI Summary');
  });

      const defaultProps = {
      logs: mockLogs,
      onLoadMore: vi.fn(),
      onDelete: vi.fn(),
      onUpdate: vi.fn(),
      onUpdateSummary: vi.fn(),
      currentUser: { id: 'user1', email: 'test@test.com', role: 'admin', class_id: null, full_name: 'Test User' },
      settings: mockSettings,
      isAdmin: true,
      campaignId: 'campaign-id-123',
    };

  it('should render correctly', () => {
    act(() => {
        render(<ActionLogPanel {...defaultProps} />);
    });
    expect(screen.getByText('activity_history_title')).toBeInTheDocument();
    expect(screen.getByText('summary_ai_title')).toBeInTheDocument();
  });

  it('should display existing recent AI summary and not generate a new one', async () => {
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago
    const settingsWithRecentSummary = {
      ...mockSettings,
      ai_summary: 'Existing recent summary',
      ai_summary_updated_at: recentDate.toISOString(),
    };

    act(() => {
        render(<ActionLogPanel {...defaultProps} settings={settingsWithRecentSummary} />);
    });

    expect(screen.getByText('Existing recent summary')).toBeInTheDocument();
    expect(geminiService.generateAdminSummary).not.toHaveBeenCalled();
    expect(screen.getByText(/last_updated/)).toBeInTheDocument();
  });

  it('should generate a new AI summary if none exists in settings', async () => {
    act(() => {
      render(<ActionLogPanel {...defaultProps} />);
    });
    
    // Check for the loading state. We specifically look for the text in a span that is NOT a button
    // The selector 'div > span' targets the span inside the flex container of the loading state
    const analyzingDataElement = await screen.findByText('analyzing_data', { selector: 'div > span' });
    expect(analyzingDataElement).toBeInTheDocument();

    await waitFor(() => {
      expect(geminiService.generateAdminSummary).toHaveBeenCalledWith(
        mockLogs, mockSettings, 'en', defaultProps.campaignId
      );
      expect(screen.getByText('Generated AI Summary')).toBeInTheDocument();
    });
  });

  it('should regenerate AI summary when "Generate New Analysis" button is clicked', async () => {
    // Start with an old summary to ensure regeneration
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 2); // 2 days ago
    const settingsWithOldSummary = {
      ...mockSettings,
      ai_summary: 'Old summary',
      ai_summary_updated_at: oldDate.toISOString(),
    };

    act(() => {
        render(<ActionLogPanel {...defaultProps} settings={settingsWithOldSummary} />);
    });

    // Initially, it should show the old summary
    expect(screen.getByText('Old summary')).toBeInTheDocument();
    expect(geminiService.generateAdminSummary).not.toHaveBeenCalled();

    // Click the regenerate button
    act(() => { 
      fireEvent.click(screen.getByRole('button', { name: 'generate_new_analysis' }));
    });

    // Check for loading state
    const analyzingDataElement = await screen.findByText('analyzing_data', { selector: 'div > span' });
    expect(analyzingDataElement).toBeInTheDocument();

    await waitFor(() => {
      expect(geminiService.generateAdminSummary).toHaveBeenCalledWith(
        mockLogs, settingsWithOldSummary, 'en', defaultProps.campaignId
      );
      expect(screen.getByText('Generated AI Summary')).toBeInTheDocument();
    });
  });

  it('should display loading state during AI summary generation', async () => {
    (geminiService.generateAdminSummary as vi.Mock).mockReturnValue(new Promise(() => {})); // Never resolve

    act(() => {
      render(<ActionLogPanel {...defaultProps} />);
    });

    // Check for loading state
    const analyzingDataElement = await screen.findByText('analyzing_data', { selector: 'div > span' });
    expect(analyzingDataElement).toBeInTheDocument();
    
    // Expect the button to be disabled and also show 'analyzing_data' (which is the button text during loading)
    expect(screen.getByRole('button', { name: 'analyzing_data' })).toBeDisabled();
  });

  it('should display "last updated" time when summary is available', async () => {
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago
    const settingsWithRecentSummary = {
      ...mockSettings,
      ai_summary: 'Existing recent summary',
      ai_summary_updated_at: recentDate.toISOString(),
    };

    act(() => {
        render(<ActionLogPanel {...defaultProps} settings={settingsWithRecentSummary} />);
    });
    
    expect(screen.getByText(/last_updated/)).toBeInTheDocument();
  });

});
