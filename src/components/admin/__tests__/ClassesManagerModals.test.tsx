import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassesManager } from '../ClassesManager';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';
import { ToastProvider } from '../../../hooks/useToast';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassRoom } from '../../../types';

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
  }
}));

const mockClasses: ClassRoom[] = [
  {
    id: 'class-1',
    name: 'Class 1',
    students: [{ id: 'student-1', name: 'Student 1', class_id: 'class-1', total_points: 0 }],
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

describe('ClassesManager Modal Editing', () => {
  it('opens edit modal when class edit button is clicked', async () => {
    renderWithContext(<ClassesManager classes={mockClasses} onRefresh={async () => {}} settings={{campaign_id: 'camp-1'}} user={{} as any} />);
    
    // Find the edit button for the class
    const editButtons = screen.getAllByTitle('edit');
    fireEvent.click(editButtons[0]);

    // Check if modal title is present
    await waitFor(() => {
      expect(screen.getByText('edit_group')).toBeInTheDocument();
    });
    
    // Check if input has the class name
    const input = screen.getByDisplayValue('Class 1');
    expect(input).toBeInTheDocument();
  });

  it('opens edit modal when student edit button is clicked', async () => {
    renderWithContext(<ClassesManager classes={mockClasses} onRefresh={async () => {}} settings={{campaign_id: 'camp-1'}} user={{} as any} />);
    
    // Open manage students view
    const manageButtons = screen.getAllByTitle('manage_students_button');
    fireEvent.click(manageButtons[0]);

    // Check that we see the manage students title
    await waitFor(() => {
      expect(screen.getByText('manage_students_title')).toBeInTheDocument();
    });

    // Find the edit button for the student. We look for the one that is visible.
    const editButtons = await screen.findAllByTitle('edit');
    // The student edit button should be in the student table which is in the overlay
    fireEvent.click(editButtons[editButtons.length - 1]);

    // Check if modal title is present
    await waitFor(() => {
      expect(screen.getByText('edit_student')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check if input has the student name
    const input = screen.getByDisplayValue('Student 1');
    expect(input).toBeInTheDocument();
  });
});
