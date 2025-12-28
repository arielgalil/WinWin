import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClasses } from '../useClasses';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '../../supabaseClient';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useClasses', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should fetch classes and students', async () => {
    const mockClasses = [{ id: 'c1', name: 'Class 1' }];
    const mockStudents = [{ id: 's1', class_id: 'c1', name: 'Student 1' }];
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classes') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockClasses, error: null })
        };
      }
      if (table === 'students') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockStudents, error: null })
        };
      }
      return {};
    });

    const { result } = renderHook(() => useClasses('camp-1'), { wrapper });

    await waitFor(() => expect(result.current.classes).toHaveLength(1), { timeout: 3000 });
    expect(result.current.classes[0].students).toHaveLength(1);
    expect(result.current.classes[0].students[0].name).toBe('Student 1');
  });

  it('should support select optimization', async () => {
    const mockClasses = [{ id: 'c1', name: 'Class 1' }];
    const mockStudents = [{ id: 's1', class_id: 'c1', name: 'Student 1' }];
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classes') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockClasses, error: null })
        };
      }
      if (table === 'students') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockStudents, error: null })
        };
      }
      return {};
    });

    // Test with selector that only picks class names
    const { result } = renderHook(() => useClasses('camp-1', { 
        select: (data: any) => data.map((c: any) => c.name)
    }), { wrapper });

    await waitFor(() => expect(result.current.classes).toEqual(['Class 1']), { timeout: 3000 });
  });
});