import { useEffect, useRef } from 'react';

/**
 * Hook to validate that we're not breaking React Rules of Hooks
 * Should be used sparingly for debugging hook issues
 */
export const useHookValidator = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 1) {
      console.warn(`🔴 Hook Rule Warning: ${componentName} is re-rendering unexpectedly`);
    }
  });
  
  return {
    renderCount: renderCount.current
  };
};