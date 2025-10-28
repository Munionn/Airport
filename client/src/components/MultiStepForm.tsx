import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui';
import { CheckCircle, Circle } from 'lucide-react';
import { clsx } from 'clsx';

interface Step {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
}

interface MultiStepFormProps {
  steps: Step[];
  onComplete: (data: any) => void;
  onCancel?: () => void;
  className?: string;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onComplete,
  onCancel,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = (stepData: any) => {
    console.log('🎯 MultiStepForm: handleNext called with stepData:', stepData);
    console.log('🎯 MultiStepForm: currentStep:', currentStep, 'isLastStep:', isLastStep);
    
    const newFormData = { ...formData, ...stepData };
    setFormData(newFormData);
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (isLastStep) {
      console.log('🎯 MultiStepForm: calling onComplete with data:', newFormData);
      onComplete(newFormData);
    } else {
      console.log('🎯 MultiStepForm: moving to next step');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.has(stepIndex) || stepIndex < currentStep;
  };

  return (
    <div className={clsx('max-w-4xl mx-auto', className)}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={clsx(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2',
                    isStepCompleted(index)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : index === currentStep
                      ? 'border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-500'
                  )}
                >
                  {isStepCompleted(index) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500">{step.description}</p>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-4',
                    isStepCompleted(index) ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <p className="text-gray-600">{currentStepData.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {React.cloneElement(currentStepData.component as React.ReactElement, {
              onNext: handleNext,
              onPrevious: handlePrevious,
              onCancel: handleCancel,
              formData,
              isFirstStep,
              isLastStep,
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
