import { Suspense } from 'react';
import { CustomStoryContent } from '@/components/create/custom-story-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CustomStoryPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CustomStoryContent />
    </Suspense>
  );
}