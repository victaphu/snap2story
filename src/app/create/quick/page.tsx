import { Suspense } from 'react';
import { QuickCreateContent } from '@/components/create/quick-create-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function QuickCreatePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}> 
      <QuickCreateContent />
    </Suspense>
  );
}

