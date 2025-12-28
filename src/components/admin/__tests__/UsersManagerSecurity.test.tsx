import { render, screen } from '@testing-library/react';
import { UsersManager } from '../UsersManager';
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

vi.mock('../../../supabaseClient', () => {
  const mockData = [
    { 
      user_id: 'super-1', 
      role: 'admin', 
      profiles: { id: 'super-1', email: 'super@test.com', full_name: 'Super Admin', role: 'superuser' } 
    },
    { 
      user_id: 'manager-1', 
      role: 'admin', 
      profiles: { id: 'manager-1', email: 'manager@test.com', full_name: 'Manager', role: 'admin' } 
    }
  ];

  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: mockData, error: null })
        }),
        delete: () => ({ match: () => Promise.resolve({ error: null }) }),
        update: () => ({ match: () => Promise.resolve({ error: null }), eq: () => Promise.resolve({ error: null }) })
      }),
      rpc: vi.fn(),
    },
    createTempClient: vi.fn()
  };
});

describe('UsersManager Security', () => {
  const managerUser = { id: 'manager-1', role: 'admin' };
  const superUser = { id: 'super-1', role: 'superuser' };

  it('hides edit and delete buttons for Super Admin when viewed by a Manager', async () => {
    render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <UsersManager classes={[]} settings={{}} currentUser={managerUser as any} currentCampaign={{id: 'test-camp'} as any} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );

    // Wait for the specific row to appear
    const row = await screen.findByTestId('row-super-1');
    
    // According to spec, edit and delete should be hidden
    const editButton = row.querySelector('button[title="edit_action"]');
    const deleteButton = row.querySelector('button[title="delete"]');
    
    expect(editButton).toBeNull();
    expect(deleteButton).toBeNull();
  });

  it('shows edit and delete buttons for everyone when viewed by a Super User', async () => {
    render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <UsersManager classes={[]} settings={{}} currentUser={superUser as any} currentCampaign={{id: 'test-camp'} as any} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );

    const row = await screen.findByTestId('row-manager-1');
    
    const editButton = row.querySelector('button[title="edit_action"]');
    const deleteButton = row.querySelector('button[title="delete"]');
    
    expect(editButton).not.toBeNull();
    expect(deleteButton).not.toBeNull();
  });
});
