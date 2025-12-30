import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UsersManager } from '../UsersManager';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';
import { ToastProvider } from '../../../hooks/useToast';
import { describe, it, expect, vi } from 'vitest';
import { UserProfile, ClassRoom } from '../../../types';

// Mock useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'he',
    isRTL: true,
    dir: 'rtl'
  })
}));

// Mock supabase
vi.mock('../../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://test.com' } }))
      }))
    }
  },
  createTempClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(() => Promise.resolve({ data: { user: { id: 'new-user' } }, error: null }))
    }
  }))
}));

const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    full_name: 'User 1',
    email: 'user1@test.com',
    role: 'admin',
    campaign_id: 'camp-1',
    created_at: new Date().toISOString(),
    class_id: null
  }
];

const mockClasses: ClassRoom[] = [
  {
    id: 'class-1',
    name: 'Class 1',
    students: [],
    campaign_id: 'camp-1'
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

describe('UsersManager Modal Editing', () => {
  it('opens edit modal when user edit button is clicked', async () => {
    renderWithContext(
      <UsersManager 
        users={mockUsers} 
        classes={mockClasses} 
        campaignId="camp-1" 
        onRefresh={async () => {}} 
      />
    );
    
    // Find the edit button for the user
    const editButtons = screen.getAllByTitle('edit_action');
    fireEvent.click(editButtons[0]);

    // Check if modal title is present
    await waitFor(() => {
      expect(screen.getByText('edit_user_details')).toBeInTheDocument();
    });
    
    // Check if input has the user full name
    const input = screen.getByDisplayValue('User 1');
    expect(input).toBeInTheDocument();
  });
});
