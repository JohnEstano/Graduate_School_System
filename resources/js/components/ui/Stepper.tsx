// components/ui/Stepper.tsx
import { Fragment, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
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
                    'flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2',
                    active
                      ? 'border-rose-500'
                      : 'border-gray-300'
                  )}
                  style={{
                    background: active ? '#f43f5e' : '#fff',
                    position: 'relative',
                  }}
                >
                  <span
                    className={cn(
                      'block rounded-full',
                      active
                        ? 'bg-white'
                        : 'bg-gray-400'
                    )}
                    style={{
                      width: '12px',
                      height: '12px',
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </motion.div>
                {i < steps.length - 1 && (
                  <motion.div
                    layout
                    transition={{ duration: 0.3 }}
                    className="h-0.5 flex-1 min-w-[40px] bg-gray-300"
                    style={{ marginLeft: 4, marginRight: 4 }}
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
