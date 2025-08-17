import { NextRequest, NextResponse } from 'next/server';

type Address = {
  name?: string;
  line1: string;
  city: string;
  state?: string;
  postal: string;
  country: string;
};

type Spec = {
  length: number; // 20 | 30
  cover: 'softcover' | 'hardcover';
  quantity?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { address, spec } = (await req.json()) as { address: Address; spec: Spec };

    if (!address?.line1 || !address?.city || !address?.postal || !address?.country) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }
    if (!spec?.length || ![20, 30].includes(spec.length) || !spec.cover) {
      return NextResponse.json({ error: 'Invalid spec' }, { status: 400 });
    }

    // Placeholder cost model if Lulu API is unavailable
    const qty = spec.quantity && spec.quantity > 0 ? spec.quantity : 1;
    const perPageCents = 10; // $0.10 per page
    const coverCents = spec.cover === 'hardcover' ? 1000 : 400; // $10 or $4
    const fulfillmentCents = 150; // $1.50 fulfillment fee
    const printCostPerUnit = coverCents + spec.length * perPageCents + fulfillmentCents;
    const printCostCents = printCostPerUnit * qty;

    // Mock shipping tiers (USD). In production, call Lulu shipping options API.
    const shippingBase = 599; // $5.99 base standard
    const expedited = 999; // $9.99
    const priority = 1999; // $19.99

    const options = [
      { service: 'Standard', eta: '5–8 business days', shipping_cents: shippingBase },
      { service: 'Expedited', eta: '3–5 business days', shipping_cents: expedited },
      { service: 'Priority', eta: '1–3 business days', shipping_cents: priority },
    ].map((o) => ({ ...o, total_cents: printCostCents + o.shipping_cents }));

    // If Lulu API credentials are set, attempt a real quote (best-effort, fallback to mock on failure)
    // Note: With limited network access, this path may be skipped at runtime.
    // const LULU_API_URL = process.env.LULU_API_URL;
    // const LULU_API_KEY = process.env.LULU_API_KEY;
    // if (LULU_API_URL && LULU_API_KEY) {
    //   try {
    //     // TODO: implement real call to Lulu shipping options endpoint using their spec
    //   } catch (e) {
    //     // swallow and use mock above
    //   }
    // }

    return NextResponse.json({
      currency: 'USD',
      print_cost_cents: printCostCents,
      fulfillment_cents: 0, // included in printCostPerUnit for the mock
      options,
    });
  } catch (err) {
    console.error('Lulu quote error:', err);
    return NextResponse.json({ error: 'Failed to get shipping options' }, { status: 500 });
  }
}

