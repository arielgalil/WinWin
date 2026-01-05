import { useCallback, useEffect, useState } from "react";
import { BurstNotificationData } from "../types";

interface UseBurstQueueOptions {
    enabled: boolean;
    enabledTypes: string[];
}

interface UseBurstQueueReturn {
    activeBurst: BurstNotificationData | null;
    setActiveBurst: (burst: BurstNotificationData | null) => void;
    addToBurstQueue: (data: Omit<BurstNotificationData, "id">) => void;
    queueLength: number;
}

/**
 * Hook to manage a queue of burst notifications.
 * Automatically advances to next notification when current is dismissed.
 */
export function useBurstQueue({
    enabled,
    enabledTypes,
}: UseBurstQueueOptions): UseBurstQueueReturn {
    const [burstQueue, setBurstQueue] = useState<BurstNotificationData[]>([]);
    const [activeBurst, setActiveBurst] = useState<
        BurstNotificationData | null
    >(null);

    // Generate unique ID for notification
    const generateId = useCallback((type: string) => {
        return `${type.toLowerCase()}-${Date.now()}-${
            Math.random().toString(36).substr(2, 5)
        }`;
    }, []);

    // Add to queue
    const addToBurstQueue = useCallback(
        (data: Omit<BurstNotificationData, "id">) => {
            if (!enabled || !enabledTypes.includes(data.type as string)) {
                return;
            }

            const notification: BurstNotificationData = {
                ...data,
                id: generateId(data.type),
            } as BurstNotificationData;

            setBurstQueue((prev) => [...prev, notification]);
        },
        [enabled, enabledTypes, generateId],
    );

    // Process queue - show next notification when current is dismissed
    useEffect(() => {
        if (!activeBurst && burstQueue.length > 0) {
            const next = burstQueue[0];
            setActiveBurst(next);
            setBurstQueue((prev) => prev.slice(1));
        }
    }, [activeBurst, burstQueue]);

    return {
        activeBurst,
        setActiveBurst,
        addToBurstQueue,
        queueLength: burstQueue.length,
    };
}
