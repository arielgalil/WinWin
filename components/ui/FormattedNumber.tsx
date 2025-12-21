
import React from 'react';

interface FormattedNumberProps {
  value: number;
  className?: string;
  forceSign?: boolean; // If true, positive numbers will show '+'
}

export const FormattedNumber: React.FC<FormattedNumberProps> = ({ value, className = "", forceSign = false }) => {
  const absVal = Math.abs(value).toLocaleString();
  
  const isNegative = value < 0;
  const isPositive = value > 0;
  const showPlus = forceSign && isPositive;
  const showMinus = isNegative;

  // Render format: [Sign][Number] inside an LTR container.
  // This ensures standard math notation (-100) even in RTL layout.
  
  return (
    <span className={`inline-block font-mono tracking-tight ${className}`} dir="ltr">
      {showMinus ? '-' : (showPlus ? '+' : '')}{absVal}
    </span>
  );
};
