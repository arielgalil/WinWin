import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { logger } from '../utils/logger';

export const useRealtimeSubscriptions = (campaignId: string | undefined, onRealtimeUpdate?: () => void) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const invalidate = useCallback(() => {
    if (!campaignId) return;
    queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['logs', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['ticker', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['settings', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    onRealtimeUpdate?.();
  }, [queryClient, campaignId, onRealtimeUpdate]);

  useEffect(() => {
    if (!campaignId) return;
    
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Create new channel
    const channel = supabase.channel(`realtime_${campaignId}`);
    channelRef.current = channel;

    // Set up subscriptions with proper error handling
    const subscriptions = [
      {
        table: 'classes',
        handler: (payload: any) => {
          logger.debug("Realtime: Classes update received", payload);
          queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
          queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
          invalidate();
        }
      },
      {
        table: 'students',
        handler: (payload: any) => {
          logger.debug("Realtime: Students update received", payload);
          queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
          queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
          invalidate();
        }
      },
      {
        table: 'action_logs',
        handler: () => invalidate()
      },
      {
        table: 'app_settings',
          handler: (payload: any) => {
            logger.debug("Realtime: Settings update received", payload);
            invalidate();
          }
      },
      {
        table: 'ticker_messages',
        handler: () => invalidate()
      },
      {
        table: 'campaigns',
        handler: (payload: any) => {
          logger.info("Realtime: Campaign update received", payload);
          invalidate();
        }
      }
    ];

    // Subscribe to all tables
    subscriptions.forEach(({ table, handler }) => {
      const filter = table === 'app_settings' || table === 'campaigns' 
        ? {} 
        : { filter: `campaign_id=eq.${campaignId}` };
      
      channel.on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table,
        ...filter
      }, handler);
    });

    // Subscribe with error handling
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`Successfully subscribed to realtime updates for ${campaignId}`);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error(`Realtime subscription error for ${campaignId}`);
      }
    });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        logger.info(`Cleaning up realtime subscription for ${campaignId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [campaignId, invalidate, queryClient]);

  return { invalidate };
};