
import React from 'react';
import { motion } from 'framer-motion';

const MotionCircle = motion.circle as any;

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  max, 
  size = 40, 
  strokeWidth = 3, 
  className = "",
  showText = true 
}) => {
  const safeMax = max > 0 ? max : 100; // Prevent division by zero
  const percentage = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color Logic
  let color = '#ef4444'; // Red (Start)
  if (percentage >= 100) color = '#10b981'; // Green (Done)
  else if (percentage >= 66) color = '#3b82f6'; // Blue (Close)
  else if (percentage >= 33) color = '#fbbf24'; // Yellow (Mid)

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <MotionCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white tabular-nums">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};
