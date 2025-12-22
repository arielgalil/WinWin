import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const useRealtimeSubscriptions = (campaignId: string | undefined, onRealtimeUpdate?: () => void) => {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    if (!campaignId) return;
    queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['logs', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['ticker', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['settings', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId?.split('/')[0]] });
    onRealtimeUpdate?.();
  }, [queryClient, campaignId, onRealtimeUpdate]);

  useEffect(() => {
    if (!campaignId) return;
    
    const channel = supabase.channel(`realtime_${campaignId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classes', 
        filter: `campaign_id=eq.${campaignId}` 
      }, (payload) => {
        console.log("Realtime: Classes update received", payload);
        queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
        queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
        invalidate();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students', 
        filter: `campaign_id=eq.${campaignId}` 
      }, (payload) => {
        console.log("Realtime: Students update received", payload);
        queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
        queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
        invalidate();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'action_logs', 
        filter: `campaign_id=eq.${campaignId}` 
      }, () => invalidate())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings', 
      }, (payload) => {
        console.log("Realtime: Settings update received", payload);
        invalidate();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ticker_messages', 
        filter: `campaign_id=eq.${campaignId}` 
      }, () => invalidate())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'campaigns', 
      }, (payload) => {
        console.log("Realtime: Campaign update received", payload);
        invalidate();
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${campaignId}:`, status);
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [campaignId, invalidate, queryClient]);

  return { invalidate };
};