'use client';

import Link from 'next/link';
import { Sparkles, ShoppingCart, Gift, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRICING } from '@/lib/constants';

interface UpsellPanelProps {
  bookId?: string;
}

export function UpsellPanel({ bookId }: UpsellPanelProps) {
  const checkoutBase = '/checkout';
  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade & Extras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Buy Full Digital Book</div>
              <div className="text-sm text-muted-foreground">20–30 pages, no watermark</div>
            </div>
            <Button asChild>
              <Link href={`${checkoutBase}?type=digital${bookId?`&bookId=${bookId}`:''}`}>
                <ShoppingCart className="h-4 w-4 mr-2" /> ${PRICING.DIGITAL_FULL}
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Export to Canva</div>
              <div className="text-sm text-muted-foreground">Edit pages in Canva workspace</div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`${checkoutBase}?type=canva${bookId?`&bookId=${bookId}`:''}`}>
                ${PRICING.CANVA_EXPORT} <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Order Print (Lulu)</div>
              <div className="text-sm text-muted-foreground">Live shipping quotes at checkout</div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`${checkoutBase}?type=print${bookId?`&bookId=${bookId}`:''}`}>Order Print</Link>
            </Button>
          </div>
          <div className="text-center">
            <Button variant="ghost" asChild>
              <Link href={`/share/${bookId || 'preview'}`}>
                <Gift className="h-4 w-4 mr-2" /> Gift link
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

