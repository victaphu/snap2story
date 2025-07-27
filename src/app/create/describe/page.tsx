import { Suspense } from 'react';
import { DescribeStoryContent } from '@/components/create/describe-story-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DescribePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DescribeStoryContent />
    </Suspense>
  );
}