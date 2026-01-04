import { useEffect, useState } from "react";

/**
 * Hook to detect user inactivity (idle mode).
 * Useful for kiosk displays to hide cursor and disable hover interactions.
 */
export const useIdleMode = (timeoutMs = 5000) => {
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let timer: any;

        const handleActivity = () => {
            setIsIdle(false);
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => setIsIdle(true), timeoutMs);
        };

        // Events to track
        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "touchstart",
            "scroll",
        ];

        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        // Initial timer
        timer = setTimeout(() => setIsIdle(true), timeoutMs);

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeoutMs]);

    useEffect(() => {
        if (isIdle) {
            document.body.classList.add("no-interaction");
        } else {
            document.body.classList.remove("no-interaction");
        }
    }, [isIdle]);

    return isIdle;
};
