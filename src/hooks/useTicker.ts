import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { TickerMessage } from '../types';

interface UseTickerOptions<T = TickerMessage[]> {
  select?: (data: TickerMessage[]) => T;
}

export const useTicker = <T = TickerMessage[]>(
  campaignId: string | undefined,
  options: UseTickerOptions<T> = {}
) => {
  const { select } = options;
  const queryClient = useQueryClient();

  const { data: tickerMessages = [] as any, isLoading, isError, error } = useQuery({
    queryKey: ['ticker', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('display_order');
      
      if (error) {
        console.error("Ticker fetch error:", error);
        throw error;
      }
      return data as TickerMessage[];
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
    select: select as any,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ticker', campaignId] });

  const addTickerMessage = async (text: string) => {
    if (!campaignId) throw new Error('No campaign ID');
    const { error } = await supabase.from('ticker_messages').insert({ text, campaign_id: campaignId });
    if (error) throw error;
    invalidate();
  };

  const deleteTickerMessage = async (id: string) => {
    const { error } = await supabase.from('ticker_messages').delete().eq('id', id);
    if (error) throw error;
    invalidate();
  };

  const updateTickerMessage = async ({ id, ...updates }: { id: string; [key: string]: any }) => {
    const { error } = await supabase.from('ticker_messages').update(updates).eq('id', id);
    if (error) throw error;
    invalidate();
  };

  return {
    tickerMessages: tickerMessages as T,
    isLoading,
    isError,
    error,
    addTickerMessage,
    deleteTickerMessage,
    updateTickerMessage,
    refreshTicker: () => invalidate(),
  };
};
