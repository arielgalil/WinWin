import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCampaignRole } from '../useCampaignRole';
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

describe('useCampaignRole', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should fetch user role for campaign', async () => {
    const mockRole = { role: 'admin' };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'campaign_users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRole, error: null })
        };
      }
      return {};
    });

    const { result } = renderHook(() => useCampaignRole('camp-1', 'user-1'), { wrapper });

    await waitFor(() => expect(result.current.isLoadingRole).toBe(false));
    expect(result.current.campaignRole).toBe('admin');
  });
});
