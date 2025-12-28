import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { UsersManager } from '../admin/UsersManager';
import { ClassesManager } from '../admin/ClassesManager';
import { MessagesManager } from '../admin/MessagesManager';
import { LanguageProvider } from '../../contexts/LanguageContext';
vi.mock('../../hooks/useTheme', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));
import { SaveNotificationProvider } from '../../contexts/SaveNotificationContext';
import { ToastProvider } from '../../hooks/useToast';
import { BrowserRouter } from 'react-router-dom';
import * as supabaseModule from '../../supabaseClient';

// Mock translations
vi.mock('../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string, params?: any) => {
      if (key === 'confirm_delete_student') return `Confirm delete ${params?.studentName}`;
      return key;
    },
    language: 'he',
    dir: 'rtl',
    isRTL: true
  })
}));

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
  createTempClient: vi.fn(),
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
      <LanguageProvider>
        <SaveNotificationProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SaveNotificationProvider>
      </LanguageProvider>
  </BrowserRouter>
);

describe('Delete Flows Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('UsersManager: opens standardized delete modal', async () => {
    const mockUsers = [
      { user_id: 'user-1', role: 'teacher', profiles: { id: 'user-1', email: 'test@user.com', full_name: 'Test User', class_id: 'class-1', role: 'teacher' } }
    ];
    
    // Mock the initial fetch in useEffect
    (supabaseModule.supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockUsers, error: null })
      })
    });

    render(
      <Wrapper>
        <UsersManager 
          classes={[]} 
          currentUser={{ id: 'admin-id', role: 'admin' } as any}
          currentCampaign={{ id: 'camp-1' } as any}
          settings={{}}
        />
      </Wrapper>
    );

    // Find all delete buttons and click the first one (for the user)
    const deleteBtns = await screen.findAllByTitle('delete');
    fireEvent.click(deleteBtns[0]);

    const titleElements = screen.getAllByText('delete_user');
    expect(titleElements.length).toBeGreaterThan(0);
    expect(screen.getByText('confirm_delete_user')).toBeInTheDocument();
  });

  it('ClassesManager: opens standardized delete modal for group', async () => {
    const mockClasses = [
      { id: 'class-1', name: 'Class 1', color: 'bg-blue-500', students: [] }
    ];

    render(
      <Wrapper>
        <ClassesManager 
          classes={mockClasses as any} 
          settings={{ campaign_id: 'camp-1' }}
          onRefresh={vi.fn()}
          user={{ role: 'admin' } as any}
        />
      </Wrapper>
    );

    const deleteBtns = screen.getAllByTitle('delete');
    fireEvent.click(deleteBtns[0]);

    const titleElements = screen.getAllByText('delete_group');
    expect(titleElements.length).toBeGreaterThan(0);
    expect(screen.getByText('confirm_delete_group_warning')).toBeInTheDocument();
  });

  it('MessagesManager: opens standardized delete modal', async () => {
    const mockMessages = [
      { id: 'msg-1', text: 'Hello World', display_order: 0 }
    ];

    render(
      <Wrapper>
        <MessagesManager 
          messages={mockMessages as any}
          onAdd={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={vi.fn()}
        />
      </Wrapper>
    );

    const deleteBtns = screen.getAllByTitle('delete');
    fireEvent.click(deleteBtns[0]);

    // Check for modal title and confirm button text (both are 'delete_message')
    const texts = screen.getAllByText('delete_message');
    expect(texts.length).toBeGreaterThan(1);
    expect(screen.getByText('confirm_deletion')).toBeInTheDocument();
  });
});