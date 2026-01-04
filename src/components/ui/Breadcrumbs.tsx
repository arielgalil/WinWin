import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const { dir } = useLanguage();
  const Separator = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <nav className={cn("flex items-center text-xs lg:text-sm text-muted-foreground mb-3", className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 lg:gap-2">
        <li className="flex items-center hover:text-foreground transition-colors cursor-pointer">
           <Home className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </li>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <li className="flex items-center">
              <Separator className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground/30" />
            </li>
            <li className={cn(
                "hover:text-foreground transition-colors",
                idx === items.length - 1 && "text-foreground font-semibold pointer-events-none"
            )}>
              {item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span className="truncate max-w-[100px] sm:max-w-[200px] block">{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};
