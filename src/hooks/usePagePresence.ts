import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { logger } from "../utils/logger";

/**
 * Hook to track concurrent viewers on a specific page using Supabase Presence.
 * @param campaignId Unique ID for the campaign/channel
 * @param pageName Identifier for the page being tracked
 * @returns viewerCount The current number of active viewers
 */
export function usePagePresence(
    campaignId: string | undefined,
    pageName: string,
) {
    const [viewerCount, setViewerCount] = useState<number>(0);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!campaignId) return;

        const channelKey = `${pageName}_presence_${campaignId}`;
        const channel = supabase.channel(channelKey);

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                // Count unique presences by checking the number of keys in the presence state
                // Each key represents a unique session/user (Supabase handles this)
                const count = Object.keys(state).length;
                setViewerCount(count);
                logger.debug(`[Presence] ${pageName} sync: ${count} viewers`);
            })
            .on("presence", { event: "join" }, ({ key, newPresences }) => {
                logger.debug(`[Presence] ${pageName} join:`, key, newPresences);
            })
            .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
                logger.debug(
                    `[Presence] ${pageName} leave:`,
                    key,
                    leftPresences,
                );
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    // Track the current user's presence
                    const presenceTrackStatus = await channel.track({
                        online_at: new Date().toISOString(),
                    });
                    logger.info(
                        `[Presence] Subscribed to ${channelKey}, track status:`,
                        presenceTrackStatus,
                    );
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [campaignId, pageName]);

    return { viewerCount };
}
