import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, idx) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Circle */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                isCompleted
                  ? 'bg-brand-primary border-brand-primary text-white shadow-glow'
                  : isActive
                    ? 'bg-surface-card border-brand-primary text-brand-primary shadow-glow'
                    : 'bg-surface-dark border-surface-border text-text-faint'
              )}>
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <p className={cn(
                  'text-xs font-semibold whitespace-nowrap',
                  isActive ? 'text-brand-primary' : isCompleted ? 'text-text-primary' : 'text-text-faint'
                )}>{step.label}</p>
                {step.description && (
                  <p className="text-[10px] text-text-faint mt-0.5 hidden sm:block">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mt-4 mx-2">
                <div className="h-0.5 rounded-full bg-surface-border overflow-hidden">
                  <div className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isCompleted ? 'bg-brand-primary w-full' : 'w-0'
                  )} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
