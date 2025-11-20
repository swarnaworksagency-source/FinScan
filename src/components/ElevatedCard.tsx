import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ElevatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function ElevatedCard({
  children,
  className,
  hover = true
}: ElevatedCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-elevated',
        hover && 'hover-lift cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
