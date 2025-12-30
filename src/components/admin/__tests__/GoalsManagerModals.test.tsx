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

const mockGoals: CompetitionGoal[] = [
  {
    id: 'goal-1',
    name: 'Goal 1',
    target_score: 1000,
    image_type: 'emoji',
    image_value: '🏆'
  }
];

const mockSettings: AppSettings = {
    school_name: 'Test School',
    competition_name: 'Test Comp',
    logo_url: null,
    goals_config: mockGoals,
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

describe('GoalsManager Modal Editing', () => {
  it('opens edit modal when goal edit button is clicked', async () => {
    renderWithContext(
      <GoalsManager 
        settings={mockSettings} 
        onUpdateSettings={async () => {}} 
        totalScore={500} 
      />
    );
    
    // Find the edit button for the goal
    const editButtons = screen.getAllByTitle('edit_stage_title');
    fireEvent.click(editButtons[0]);

    // Check if modal title is present
    await waitFor(() => {
      expect(screen.getByText('edit_goal_title')).toBeInTheDocument();
    });
    
    // Check if input has the goal name
    const input = screen.getByDisplayValue('Goal 1');
    expect(input).toBeInTheDocument();
  });
});
