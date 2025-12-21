
import React from 'react';

interface GradientBackgroundProps {
  primaryColor?: string;   // Top-Left
  secondaryColor?: string; // Bottom-Right
  brightness?: number;     // 0-100 (Controls Top-Right & Bottom-Left ambiance)
  children: React.ReactNode;
  className?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  primaryColor = '#4c1d95',
  secondaryColor = '#0f172a',
  brightness = 50, // Default to neutral
  children,
  className = ''
}) => {

  // Calculate overlay based on brightness slider (0-100)
  const getAmbientLayer = () => {
    const val = Math.max(0, Math.min(100, brightness));

    if (val < 50) {
      const opacity = ((50 - val) / 50) * 0.9;
      return `
            radial-gradient(circle at 100% 0%, rgba(0,0,0,${opacity}) 0%, transparent 60%),
            radial-gradient(circle at 0% 100%, rgba(0,0,0,${opacity}) 0%, transparent 60%)
          `;
    } else {
      const opacity = ((val - 50) / 50) * 0.4;
      return `
            radial-gradient(circle at 100% 0%, rgba(255,255,255,${opacity}) 0%, transparent 60%),
            radial-gradient(circle at 0% 100%, rgba(255,255,255,${opacity}) 0%, transparent 60%)
          `;
    }
  };

  const backgroundStyle = {
    backgroundColor: '#0f172a',
    backgroundImage: `
        radial-gradient(circle at 0% 0%, ${primaryColor} 0%, transparent 80%),
        radial-gradient(circle at 100% 100%, ${secondaryColor} 0%, transparent 80%),
        ${getAmbientLayer()}
    `,
    backgroundSize: '100% 100%',
    backgroundAttachment: 'fixed',
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full font-sans text-white z-0 overflow-hidden low-perf:bg-slate-950 low-perf:!bg-none ${className}`}
      style={backgroundStyle}
    >
      {children}
    </div>
  );
};
