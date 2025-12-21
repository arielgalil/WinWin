
import React, { useEffect, useRef } from 'react';
import { useSpring } from 'framer-motion';

export const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(safeValue, { mass: 0.5, stiffness: 120, damping: 25 });

  useEffect(() => {
    spring.set(safeValue);
  }, [safeValue, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        const rounded = Math.round(latest);
        const absVal = Math.abs(rounded).toLocaleString();
        ref.current.textContent = `${rounded < 0 ? '-' : ''}${absVal}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [spring, suffix]);

  const initial = `${safeValue < 0 ? '-' : ''}${Math.abs(safeValue).toLocaleString()}${suffix}`;
  return <span dir="ltr" ref={ref}>{initial}</span>;
};
