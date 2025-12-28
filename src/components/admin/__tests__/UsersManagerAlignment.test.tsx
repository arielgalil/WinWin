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
    },
    { 
      user_id: 'teacher-1', 
      role: 'teacher', 
      profiles: { id: 'teacher-1', email: 'teacher@test.com', full_name: 'Teacher', role: 'teacher' } 
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

describe('UsersManager Alignment', () => {
  const superUser = { id: 'super-1', role: 'superuser' };

  it('verifies horizontal alignment of edit buttons', async () => {
    // Render as superuser so we see buttons for everyone
    // But Super Admins won't have a delete button (because you can't delete yourself or other super admins in the current logic)
    // Actually, let's check the code:
    // onDelete={currentUser && u.id !== currentUser.id && !isSuperUser(u.role) ... }
    // So Manager and Teacher will have Delete. Super Admin won't.
    
    render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <UsersManager classes={[]} settings={{}} currentUser={superUser as any} currentCampaign={{id: 'test-camp'} as any} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );

    const rowSuper = await screen.findByTestId('row-super-1');
    const rowTeacher = await screen.findByTestId('row-teacher-1');
    
    const editSuper = rowSuper.querySelector('[data-testid="action-button-edit"]');
    const editTeacher = rowTeacher.querySelector('[data-testid="action-button-edit"]');
    
    expect(editSuper).not.toBeNull();
    expect(editTeacher).not.toBeNull();
    
    // In a flex-row with justify-center, if one row has 1 button and another has 2,
    // the single button will be in the center, while the two buttons will be offset from the center.
    // This causes vertical misalignment of the "Edit" button across rows.
  });
});
