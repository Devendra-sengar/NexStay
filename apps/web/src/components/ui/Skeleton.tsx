import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-border',
        {
          'h-4 w-full rounded-md': variant === 'text',
          'rounded-md': variant === 'rect',
          'rounded-full': variant === 'circle',
        },
        className
      )}
    />
  );
}
