import React, { useEffect, useRef } from 'react';

interface AutoScrollOptions {
  isHovered: boolean;
  activeTab: string; // Dependency to reset scroll on tab change
  speed?: number;
  pauseFrames?: number;
}

export const useAutoScroll = (
  containerRef: React.RefObject<HTMLDivElement>, 
  { isHovered, activeTab, speed = 0.5, pauseFrames = 90 }: AutoScrollOptions
) => {
  // Use Refs to maintain scroll state across re-renders without triggering them
  const scrollState = useRef({
      direction: 1, // 1 = down, -1 = up
      pauseCounter: pauseFrames // Start with a pause at top
  });

  // --- Reset Scroll on Tab Change ---
  useEffect(() => {
      if (containerRef.current) {
          containerRef.current.scrollTop = 0;
      }
      // Reset state: Start pausing at top, then go down
      scrollState.current = { direction: 1, pauseCounter: pauseFrames };
  }, [activeTab, pauseFrames, containerRef]);

  // --- Auto Scroll Logic (Up/Down Loop) ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isHovered) return;

    let animationFrameId: number;

    const scroll = () => {
        // 1. Check if scrolling is needed
        if (el.scrollHeight <= el.clientHeight) {
            el.scrollTop = 0;
            scrollState.current.pauseCounter = pauseFrames; 
            scrollState.current.direction = 1;
            animationFrameId = requestAnimationFrame(scroll);
            return;
        }

        // 2. Handle Pauses
        if (scrollState.current.pauseCounter > 0) {
            scrollState.current.pauseCounter--;
            animationFrameId = requestAnimationFrame(scroll);
            return;
        }

        // 3. Move
        el.scrollTop += speed * scrollState.current.direction;

        // 4. Check boundaries & Switch Direction
        
        // Check Bottom Reached
        if (scrollState.current.direction === 1 && Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight) {
            el.scrollTop = el.scrollHeight - el.clientHeight; // Snap to exact bottom
            scrollState.current.direction = -1; // Switch to UP
            scrollState.current.pauseCounter = pauseFrames; // Wait at bottom
        } 
        // Check Top Reached
        else if (scrollState.current.direction === -1 && el.scrollTop <= 0) {
            el.scrollTop = 0; // Snap to exact top
            scrollState.current.direction = 1; // Switch to DOWN
            scrollState.current.pauseCounter = pauseFrames; // Wait at top
        }

        animationFrameId = requestAnimationFrame(scroll);
    };
    
    // Start loop
    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTab, isHovered, speed, pauseFrames, containerRef]);
};