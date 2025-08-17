"use client";

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRICING } from '@/lib/constants';

export function CheckoutContent() {
  const sp = useSearchParams();
  const type = sp.get('type') || 'digital';
  const selectedLength = Number(sp.get('length') || (type === 'free' ? 5 : 20));
  const [address, setAddress] = useState({ name: '', line1: '', city: '', state: '', postal: '', country: '' });
  const [shippingQuote, setShippingQuote] = useState<{ service: string; cents: number } | null>(null);
  const [printSpec, setPrintSpec] = useState<{ length: number; cover: 'softcover' | 'hardcover' }>({ length: 20, cover: 'softcover' });
  const [printSubtotalCents, setPrintSubtotalCents] = useState<number>(0);
  const [shippingOptions, setShippingOptions] = useState<{ service: string; eta: string; shipping_cents: number; total_cents: number }[]>([]);
  const [quoting, setQuoting] = useState(false);

  const getSubtotal = () => {
    if (type === 'free') return 0;
    if (type === 'digital') return Math.round(PRICING.DIGITAL_FULL * 100);
    if (type === 'canva') return Math.round(PRICING.CANVA_EXPORT * 100);
    return printSubtotalCents || 0;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">
          {type === 'digital' ? `Buy digital book (${selectedLength} pages)` : type === 'free' ? 'Get free sample (watermarked)' : type === 'canva' ? 'Export to Canva add-on' : 'Order a printed book (quotes shown below)'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {type === 'digital' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Digital Book ({selectedLength} pages)</div>
                  <div className="text-sm text-muted-foreground">High-resolution • No watermark</div>
                </div>
                <div className="font-bold">${PRICING.DIGITAL_FULL}</div>
              </div>
            )}
            {type === 'free' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Free Sample ({selectedLength} pages)</div>
                  <div className="text-sm text-muted-foreground">Watermarked • For evaluation</div>
                </div>
                <div className="font-bold">$0.00</div>
              </div>
            )}
            {type === 'canva' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export to Canva</div>
                  <div className="text-sm text-muted-foreground">Push assets to Canva workspace</div>
                </div>
                <div className="font-bold">${PRICING.CANVA_EXPORT}</div>
              </div>
            )}
            {type === 'print' && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Enter shipping address to see live shipping options and totals.</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Name</Label>
                    <Input value={address.name} onChange={(e)=>setAddress({...address,name:e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={address.line1} onChange={(e)=>setAddress({...address,line1:e.target.value})} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={address.city} onChange={(e)=>setAddress({...address,city:e.target.value})} />
                  </div>
                  <div>
                    <Label>State/Prov</Label>
                    <Input value={address.state} onChange={(e)=>setAddress({...address,state:e.target.value})} />
                  </div>
                  <div>
                    <Label>Postal</Label>
                    <Input value={address.postal} onChange={(e)=>setAddress({...address,postal:e.target.value})} />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={address.country} onChange={(e)=>setAddress({...address,country:e.target.value})} />
                  </div>
                  <div>
                    <Label>Length</Label>
                    <select className="w-full h-9 border rounded px-2 text-sm bg-background" value={printSpec.length} onChange={(e)=>setPrintSpec({...printSpec,length:Number(e.target.value) as 20|30})}>
                      <option value={20}>20 pages</option>
                      <option value={30}>30 pages</option>
                    </select>
                  </div>
                  <div>
                    <Label>Cover</Label>
                    <select className="w-full h-9 border rounded px-2 text-sm bg-background capitalize" value={printSpec.cover} onChange={(e)=>setPrintSpec({...printSpec,cover:e.target.value as 'softcover'|'hardcover'})}>
                      <option value="softcover">Softcover</option>
                      <option value="hardcover">Hardcover</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      onClick={async ()=>{
                        setQuoting(true);
                        try {
                          setShippingOptions([]);
                          setShippingQuote(null);
                          setPrintSubtotalCents(0);
                          const res = await fetch('/api/lulu/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, spec: { ...printSpec } }) });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to quote');
                          setShippingOptions(data.options || []);
                          setPrintSubtotalCents((data.print_cost_cents || 0) + (data.fulfillment_cents || 0));
                        } catch (e: any) {
                          alert(e.message || 'Failed to get shipping options');
                        } finally {
                          setQuoting(false);
                        }
                      }}
                    >
                      {quoting ? 'Quoting…' : 'Get Shipping Options'}
                    </Button>
                    {shippingQuote && (
                      <div className="text-sm">Selected: {shippingQuote.service} ${(shippingQuote.cents/100).toFixed(2)}</div>
                    )}
                  </div>
                  {shippingOptions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Shipping Options</div>
                      <div className="space-y-2">
                        {shippingOptions.map((o)=> (
                          <label key={o.service} className="flex items-center justify-between border rounded p-2 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input type="radio" name="ship" onChange={()=>setShippingQuote({ service: o.service, cents: o.shipping_cents })} checked={shippingQuote?.service === o.service} />
                              <div className="text-sm">
                                <div className="font-medium">{o.service}</div>
                                <div className="text-muted-foreground">{o.eta}</div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">${(o.shipping_cents/100).toFixed(2)}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>${(getSubtotal()/100).toFixed(2)}</span></div>
            {type==='print' && shippingQuote && (
              <div className="flex justify-between text-sm"><span>Shipping</span><span>${(shippingQuote.cents/100).toFixed(2)}</span></div>
            )}
            <div className="border-t pt-2 font-bold flex justify-between"><span>Total</span><span>${((getSubtotal()+ (shippingQuote?.cents||0))/100).toFixed(2)}</span></div>
            <Button className="w-full mt-2" onClick={async () => {
              try {
                const payload: any = { type, length: selectedLength };
                if (type === 'print') {
                  if (!printSubtotalCents) { alert('Please get a shipping quote first.'); return; }
                  payload.subtotalCents = printSubtotalCents;
                }
                if (type === 'free') { window.location.href = '/share'; return; }
                alert('Proceeding to payment…');
              } catch (e: any) {
                alert(e.message || 'Failed to start checkout');
              }
            }}>
              {type === 'free' ? 'Get Free Sample' : 'Pay with Stripe'}
            </Button>
            <div className="mt-3 bg-muted/30 border rounded p-3 text-xs text-muted-foreground space-y-2">
              <p>
                After you continue{type==='free' ? '' : ' and complete payment'}, we’ll start creating your book. This can take a few minutes.
                We’ll email you as soon as it’s ready. Thank you for using Snap2Story!
              </p>
              <p>
                If you need help at any time, we’re happy to assist:
                <a href="mailto:support@storymosaic.com" className="underline text-primary"> support@storymosaic.com</a>
              </p>
            </div>
            <div className="text-xs text-muted-foreground">Loyalty: +10 pts per paid full book. Referral codes applied at payment.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
