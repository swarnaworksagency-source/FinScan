import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GradientBorderCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GradientBorderCard({
  children,
  className,
  hover = true
}: GradientBorderCardProps) {
  return (
    <div className={cn('relative rounded-xl', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-gold-500 rounded-xl opacity-100 group-hover:opacity-100 transition-opacity" />
      <div
        className={cn(
          'relative bg-white rounded-xl p-6 m-[2px]',
          hover && 'transition-all duration-300 group-hover:shadow-emerald-glow',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
