import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function CompleteInner() {
  // This is a simple confirmation page; real implementation can fetch order by id
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Successful</h1>
        <p className="text-muted-foreground">Thanks! Your order is confirmed and being processed.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>What’s next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">- Digital: Your full book will be unlocked for download shortly.</p>
          <p className="text-sm">- Canva: We’ll enqueue the export and notify you when it’s ready.</p>
          <p className="text-sm">- Print: We’ll create your Lulu job after validating files.</p>
          <div className="pt-2 flex gap-2">
            <Button asChild>
              <Link href="/orders">View Orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/library">Go to Library</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderCompletePage() {
  return (
    <Suspense>
      <CompleteInner />
    </Suspense>
  );
}

