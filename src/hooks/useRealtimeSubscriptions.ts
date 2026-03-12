import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import { logger } from "../utils/logger";

export const useRealtimeSubscriptions = (
  campaignId: string | undefined,
  onRealtimeUpdate?: () => void,
) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  // Use a ref so the callback never causes subscription teardown on re-render
  const onRealtimeUpdateRef = useRef(onRealtimeUpdate);
  useEffect(() => { onRealtimeUpdateRef.current = onRealtimeUpdate; }, [onRealtimeUpdate]);

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

    // Helper to trigger optional callback
    const triggerUpdate = () => onRealtimeUpdateRef.current?.();

    // Set up subscriptions with proper error handling and specific invalidations
    const subscriptions = [
      {
        table: "classes",
        handler: (payload: any) => {
          logger.debug("Realtime: Classes update received", payload);
          queryClient.invalidateQueries({ queryKey: ["classes", campaignId] });
          triggerUpdate();
        },
      },
      {
        table: "students",
        handler: (payload: any) => {
          logger.debug("Realtime: Students update received", payload);
          // Students affect classes scores, so invalidate classes
          queryClient.invalidateQueries({ queryKey: ["classes", campaignId] });
          triggerUpdate();
        },
      },
      {
        table: "action_logs",
        handler: (payload: any) => {
          logger.debug("Realtime: Action logs update received", payload);
          queryClient.invalidateQueries({ queryKey: ["logs", campaignId] });
          triggerUpdate();
        },
      },
      {
        table: "app_settings",
        handler: (payload: any) => {
          logger.debug("Realtime: Settings update received", payload);
          queryClient.invalidateQueries({ queryKey: ["settings", campaignId] });
          triggerUpdate();
        },
      },
      {
        table: "ticker_messages",
        handler: (payload: any) => {
          logger.debug("Realtime: Ticker messages update received", payload);
          queryClient.invalidateQueries({ queryKey: ["ticker", campaignId] });
          triggerUpdate();
        },
      },
      {
        table: "campaigns",
        handler: (payload: any) => {
          logger.info("Realtime: Campaign update received", payload);
          queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
          triggerUpdate();
        },
      },
    ];

    // Subscribe to all tables
    subscriptions.forEach(({ table, handler }) => {
      const filter = table === "app_settings" || table === "campaigns"
        ? {}
        : { filter: `campaign_id=eq.${campaignId}` };

      channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table,
        ...filter,
      }, handler);
    });

    // Subscribe with error handling
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        logger.info(
          `Successfully subscribed to realtime updates for ${campaignId}`,
        );
      } else if (status === "CHANNEL_ERROR") {
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
  }, [campaignId, queryClient]);

  // We don't expose a blanket invalidate function anymore to enforce specific invalidations
  return {};
};
