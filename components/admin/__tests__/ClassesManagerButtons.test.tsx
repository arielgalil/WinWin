import { render, screen } from '@testing-library/react';
import { ClassesManager } from '../ClassesManager';
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
    from: () => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })
  }
}));

const mockClasses = [
  {
    id: 'class-1',
    name: 'Class 1',
    color: 'bg-blue-500',
    students: [{}, {}],
    score: 100,
  }
];

describe('ClassesManager Buttons', () => {
  it('renders "Manage Students" button in the same column as student count', () => {
    render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <ClassesManager classes={mockClasses as any} settings={{campaign_id: 'test'}} user={{} as any} onRefresh={vi.fn()} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );

    // Find the student count text (use getAllByText because AdminTable renders both desktop and mobile versions)
    const countElements = screen.getAllByText(/2 students_label/);
    const cell = countElements[0].closest('td');
    
    // The button should be in the same cell
    const button = cell?.querySelector('button[title="manage_students_button"]');
    expect(button).toBeDefined();
    
    // Icon should be UsersIcon (lucide-users)
    const icon = button?.querySelector('.lucide-users');
    expect(icon).toBeDefined();
    // It should NOT be PlusIcon (lucide-plus)
    const plusIcon = button?.querySelector('.lucide-plus');
    expect(plusIcon).toBeNull();
  });
});
