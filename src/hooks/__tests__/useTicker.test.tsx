import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTicker } from '../useTicker';
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

describe('useTicker', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should fetch ticker messages', async () => {
    const mockTicker = [{ id: 't1', text: 'Hello' }];
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'ticker_messages') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockTicker, error: null })
        };
      }
      return {};
    });

    const { result } = renderHook(() => useTicker('camp-1'), { wrapper });

    await waitFor(() => expect(result.current.tickerMessages).toHaveLength(1));
    expect(result.current.tickerMessages[0].text).toBe('Hello');
  });
});
