import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassMorphismCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light';
}

export function GlassMorphismCard({
  children,
  className,
  variant = 'light'
}: GlassMorphismCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-6 shadow-lg',
        variant === 'dark' ? 'glass-morphism' : 'glass-morphism-light',
        className
      )}
    >
      {children}
    </div>
  );
}
