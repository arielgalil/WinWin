import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCampaign } from '../useCampaign';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '../../supabaseClient';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ slug: 'test-slug' })
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

describe('useCampaign', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should fetch campaign and settings data', async () => {
    const mockCampaign = { id: '1', slug: 'test-slug', name: 'Test Campaign' };
    const mockSettings = { campaign_id: '1', school_name: 'Test School' };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'campaigns') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCampaign, error: null })
            })
          })
        };
      }
      if (table === 'app_settings') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockSettings, error: null })
            })
          })
        };
      }
      return {};
    });

    const { result } = renderHook(() => useCampaign(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingCampaign).toBe(false));
    expect(result.current.campaign).toEqual(mockCampaign);
    
    await waitFor(() => expect(result.current.settings).toBeDefined());
    expect(result.current.settings).toEqual(mockSettings);
  });

  it('should support select optimization for settings', async () => {
    const mockSettings = { campaign_id: '1', school_name: 'Test School', primary_color: '#000' };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'campaigns') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            })
          })
        };
      }
      if (table === 'app_settings') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockSettings, error: null })
            })
          })
        };
      }
      return {};
    });

    // Test with selector that only picks school_name
    const { result } = renderHook(() => useCampaign({ 
        settingsSelector: (s: any) => s.school_name 
    }), { wrapper });

    await waitFor(() => expect(result.current.settings).toBe('Test School'));
  });
});
