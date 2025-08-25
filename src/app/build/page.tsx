import { Suspense } from 'react';
import { BuildContent } from '@/components/build/build-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function BuildPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}> 
      <BuildContent />
    </Suspense>
  );
}

