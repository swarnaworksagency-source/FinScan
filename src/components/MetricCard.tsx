import { useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  icon?: LucideIcon;
  className?: string;
  animate?: boolean;
  decimals?: number;
}

export function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  trend,
  icon: Icon,
  className,
  animate = true,
  decimals = 0
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(stepValue * currentStep);
      } else {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, animate]);

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-elevated hover-lift',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <Icon className="w-8 h-8 text-slate-300" />
        )}
      </div>

      <div className="space-y-2">
        <div className="text-5xl font-bold text-navy font-mono">
          {prefix}
          {displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          {suffix}
        </div>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-semibold',
              trend.positive ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-slate-500 font-normal ml-1">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}
