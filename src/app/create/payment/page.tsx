import { Suspense } from 'react';
import { PaymentContent } from '@/components/create/payment-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentContent />
    </Suspense>
  );
}