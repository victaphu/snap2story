import { Suspense } from 'react';
import { UploadPhotoContent } from '@/components/create/upload-photo-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function UploadPhotoPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UploadPhotoContent />
    </Suspense>
  );
}