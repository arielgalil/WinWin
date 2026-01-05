import React, { useEffect, useRef, useState } from "react";
import { KIOSK_CONSTANTS } from "../constants";
import { AppSettings } from "../types";

interface RotationItem {
    url: string;
    duration?: number;
    hidden?: boolean;
}

interface UseKioskRotationOptions {
    settings: AppSettings | null;
    isKioskStarted: boolean;
}

interface UseKioskRotationReturn {
    kioskIndex: number;
    currentView: RotationItem | undefined;
    isHiddenByKiosk: boolean;
    isDashboardActive: boolean;
}

/**
 * Hook to manage kiosk rotation logic.
 * Handles automatic rotation between dashboard and external sites.
 */
export function useKioskRotation({
    settings,
    isKioskStarted,
}: UseKioskRotationOptions): UseKioskRotationReturn {
    const [kioskIndex, setKioskIndex] = useState(0);
    const timerRef = useRef<number | undefined>(undefined);

    const config = settings?.rotation_config || [];
    const rotationEnabled = settings?.rotation_enabled && config.length > 0 &&
        isKioskStarted;

    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }

        if (!rotationEnabled) {
            // Find dashboard index or default to 0
            const dashIdx = config.findIndex((i) =>
                i.url === KIOSK_CONSTANTS.DASHBOARD_URL
            );
            if (dashIdx !== -1 && kioskIndex !== dashIdx) {
                setKioskIndex(dashIdx);
            } else if (config.length === 0) {
                setKioskIndex(0);
            }
            return;
        }

        const rotate = () => {
            setKioskIndex((prev) => {
                // Find next visible index
                let next = (prev + 1) % config.length;
                let count = 0;
                while (config[next]?.hidden && count < config.length) {
                    next = (next + 1) % config.length;
                    count++;
                }
                return next;
            });
        };

        // Determine duration for current view
        const currentItem = config[kioskIndex] || config[0];
        const currentDuration = currentItem?.duration ||
            settings?.rotation_interval || 30;

        timerRef.current = window.setTimeout(rotate, currentDuration * 1000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }
        };
    }, [kioskIndex, rotationEnabled, config, settings?.rotation_interval]);

    const currentView = config[kioskIndex];
    const isHiddenByKiosk = currentView
        ? currentView.url !== KIOSK_CONSTANTS.DASHBOARD_URL
        : false;
    const isDashboardActive = !isHiddenByKiosk;

    return {
        kioskIndex,
        currentView,
        isHiddenByKiosk,
        isDashboardActive,
    };
}
