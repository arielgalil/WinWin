import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessagesManager } from '../MessagesManager';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';
import { ToastProvider } from '../../../hooks/useToast';
import { describe, it, expect, vi } from 'vitest';
import { TickerMessage } from '../../../types';

// Mock useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'he',
    isRTL: true,
    dir: 'rtl'
  })
}));

const mockMessages: TickerMessage[] = [
  {
    id: 'msg-1',
    text: 'Test Message 1',
    campaign_id: 'camp-1',
  }
];

const renderWithContext = (ui: React.ReactNode) => {
  return render(
    <ToastProvider>
      <SaveNotificationProvider>
        {ui}
      </SaveNotificationProvider>
    </ToastProvider>
  );
};

describe('MessagesManager Modal Editing', () => {
  it('opens edit modal when message edit button is clicked', async () => {
    renderWithContext(
      <MessagesManager 
        messages={mockMessages} 
        onAdd={async () => {}} 
        onDelete={async () => {}} 
        onUpdate={async () => {}} 
      />
    );
    
    // Find the edit button for the message
    const editButtons = await screen.findAllByTitle('edit_message');
    fireEvent.click(editButtons[0]);

    // Check if modal title is present
    await waitFor(() => {
      expect(screen.getByText('edit_message')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check if input has the message content
    const input = screen.getByDisplayValue('Test Message 1');
    expect(input).toBeInTheDocument();
  });
});
