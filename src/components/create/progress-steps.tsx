'use client';

import { useRouter } from 'next/navigation';

interface ProgressStepsProps {
  mode: string;
  currentStep: number;
  sampleId?: string | null;
  skippedUpload?: boolean;
}

export function ProgressSteps({ mode, currentStep, sampleId, skippedUpload }: ProgressStepsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center space-x-4 pt-2">
      {mode === 'ai-assisted' && !sampleId ? (
        // New AI-assisted workflow - theme first
        <>
          <button
            onClick={() => currentStep > 1 ? router.push(`/create/theme?mode=${mode}`) : undefined}
            className={`flex items-center ${currentStep > 1 ? 'hover:opacity-80 transition-opacity cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep > 1 ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'
            }`}>Choose Theme</span>
          </button>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Upload Photo</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Pay & Create</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              4
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Complete Book</span>
          </div>
        </>
      ) : sampleId ? (
        // Old workflow with sample
        <>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <span className="ml-2 text-sm text-primary font-medium">Sample Generated</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Choose Theme</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Review & Pay</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              4
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Create Full Story</span>
          </div>
        </>
      ) : (
        // Custom workflow
        <>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Upload & Describe</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Review & Pay</span>
          </div>
          <div className="w-16 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>Create Story</span>
          </div>
        </>
      )}
    </div>
  );
}