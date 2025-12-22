import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { TickerMessage } from '../types';

export const useTickerMessages = (campaignId: string | undefined) => {
  const { data: tickerMessages = [] } = useQuery({
    queryKey: ['ticker', campaignId],
    queryFn: async () => {
        const { data, error } = await supabase.from('ticker_messages').select('*').eq('campaign_id', campaignId).order('display_order');
        if (error) console.error("Ticker fetch error:", error);
        return data as TickerMessage[];
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: logsData, fetchNextPage: loadMoreLogs } = useInfiniteQuery({
    queryKey: ['logs', campaignId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.from('action_logs').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }).range(Number(pageParam), Number(pageParam) + 24);
      if (error) console.error("Logs fetch error:", error);
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.length === 25 ? allPages.length * 25 : undefined,
    enabled: !!campaignId,
  });

  return {
    tickerMessages,
    logs: logsData?.pages.flat() || [],
    loadMoreLogs
  };
};

export const useTickerMutations = (campaignId: string | undefined, invalidate: () => void) => {
  const addTickerMessage = async (text: string) => {
    if (!campaignId) throw new Error('No campaign ID');
    const { error } = await supabase.from('ticker_messages').insert({ text, campaign_id: campaignId });
    if (error) console.error("Ticker add error:", error);
    invalidate();
  };

  const deleteTickerMessage = async (id: string) => {
    const { error } = await supabase.from('ticker_messages').delete().eq('id', id);
    if (error) console.error("Ticker delete error:", error);
    invalidate();
  };

  const updateTickerMessage = async ({ id, ...updates }: { id: string; [key: string]: any }) => {
    const { error } = await supabase.from('ticker_messages').update(updates).eq('id', id);
    if (error) console.error("Ticker update error:", error);
    invalidate();
  };

  return {
    addTickerMessage,
    deleteTickerMessage,
    updateTickerMessage
  };
};