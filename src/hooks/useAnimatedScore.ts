import { useEffect, useRef, useState } from 'react';

/**
 * Animates a numeric value from its previous to its new target using
 * ease-out cubic interpolation. Returns the current animated value.
 *
 * Usage:
 *   const animatedScore = useAnimatedScore(totalScore);
 *   <FormattedNumber value={animatedScore} />
 */
export function useAnimatedScore(target: number, duration = 500): number {
    const [displayed, setDisplayed] = useState(target);
    // Ref always holds the current rendered value so we can animate FROM it
    const displayedRef = useRef(target);
    const rafRef = useRef<number | undefined>(undefined);

    displayedRef.current = displayed;

    useEffect(() => {
        const from = displayedRef.current;

        if (from === target) return;

        if (rafRef.current !== undefined) {
            cancelAnimationFrame(rafRef.current);
        }

        const startTime = performance.now();

        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic: fast start, smooth landing
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(from + (target - from) * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = undefined;
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current !== undefined) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [target, duration]);

    return displayed;
}
