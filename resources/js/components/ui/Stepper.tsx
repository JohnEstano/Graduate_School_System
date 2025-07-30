// components/ui/Stepper.tsx
import { Fragment, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Step {
  content: ReactNode;
}
interface StepperProps {
  steps: Step[];
  currentStep: number;
  onNext(): void;
  onPrev(): void;
  loading?: boolean;         
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onNext,
  onPrev,
  loading = false,           
  className,
}: StepperProps) {
  const current = steps[currentStep];

  return (
    <div className={cn('flex flex-col w-full h-full', className)}>
      {/* progress indicator */}
      <div className="w-full overflow-x-auto mb-4 p-2 flex-shrink-0">
        <div className="min-w-fit flex items-center gap-2">
          {steps.map((_, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <Fragment key={i}>
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs',
                    done || active
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-transparent border-gray-300 text-gray-600'
                  )}
                >
                  {done ? (
                    <Check size={12} />
                  ) : (
                    <Circle size={12} fill="currentColor" className="text-white-500" />
                  )}
                </motion.div>
                {i < steps.length - 1 && (
                  <motion.div
                    layout
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'h-[2px] flex-1 min-w-[20px]',
                      i < currentStep ? 'bg-rose-500' : 'bg-gray-300'
                    )}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* step content */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 text-sm">
        {current?.content}
      </div>

      {/* nav buttons */}
      <div className="sticky bottom-0 bg-white pt-4 pb-2 px-3 flex justify-end gap-2 border-t border-gray-200">
        <Button variant="ghost" onClick={onPrev} disabled={currentStep === 0 || loading}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={loading}>
          {loading
            ? 'Saving…'
            : currentStep === steps.length - 1
            ? 'Finish'
            : 'Next'}
        </Button>
      </div>
    </div>
  );
}
