import React from 'react';
import { ImageIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  className?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ className }) => {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-full min-h-[150px] bg-muted/30 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center animate-in fade-in duration-500",
        className
      )}
    >
      <div className="bg-background/50 p-4 rounded-full mb-3 shadow-sm border border-muted/50">
        <ImageIcon className="w-12 h-12 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium text-muted-foreground/80">
        {t('no_image_uploaded')}
      </p>
    </div>
  );
};
