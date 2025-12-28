import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogs } from '../useLogs';
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

describe('useLogs', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should fetch logs with infinite query', async () => {
    const mockLogs = [{ id: 'l1', description: 'Action 1' }];
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'action_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockLogs, error: null })
        };
      }
      return {};
    });

    const { result } = renderHook(() => useLogs('camp-1'), { wrapper });

    await waitFor(() => expect(result.current.logs).toHaveLength(1));
    expect(result.current.logs[0].description).toBe('Action 1');
  });
});
