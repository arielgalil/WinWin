import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { ActionLog } from '../types';

export const useLogs = (campaignId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['logs', campaignId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('action_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .range(Number(pageParam), Number(pageParam) + 24);
      
      if (error) {
        console.error("Logs fetch error:", error);
        throw error;
      }
      return data as ActionLog[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === 25 ? allPages.length * 25 : undefined,
    enabled: !!campaignId,
    staleTime: 1000 * 30, // 30 seconds
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['logs', campaignId] });

  const deleteLog = async (id: string) => {
    const { data: log, error: fetchErr } = await supabase
        .from('action_logs')
        .select('is_cancelled')
        .eq('id', id)
        .single();
    
    if (fetchErr) throw fetchErr;
    
    const { error: updErr } = await supabase
        .from('action_logs')
        .update({ is_cancelled: !log?.is_cancelled })
        .eq('id', id);
    
    if (updErr) throw updErr;
    
    invalidate();
  };

  const updateLog = async ({ id, description, points }: { id: string; description: string; points: number }) => {
    const { error } = await supabase.from('action_logs').update({ description, points }).eq('id', id);
    if (error) throw error;
    invalidate();
  };

  return {
    logs: data?.pages.flat() || [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    deleteLog,
    updateLog,
    refreshLogs: () => invalidate()
  };
};
