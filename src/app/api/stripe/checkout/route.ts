import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { BriefDB } from '@/lib/services/database';
import { PRICING } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const type = (body?.type as 'digital' | 'canva' | 'print') || 'digital';
    const bookId = (body?.bookId as string) || null;
    const referralCode = (body?.referralCode as string) || null;
    const shippingCents = Number(body?.shippingCents || 0);
    const taxCents = Number(body?.taxCents || 0);

    // Ensure profile exists and get internal user id
    const profile = await BriefDB.getProfileByClerk(clerkId) || await BriefDB.upsertProfileByClerk(clerkId, '');
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
    }

    // Determine subtotal by product type
    let subtotalCents = 0;
    let name = '';
    if (type === 'digital') {
      subtotalCents = Math.round(PRICING.DIGITAL_FULL * 100);
      name = 'Digital Full Book (20–30 pages)';
    } else if (type === 'canva') {
      subtotalCents = Math.round(PRICING.CANVA_EXPORT * 100);
      name = 'Canva Export Add-on';
    } else if (type === 'print') {
      // For print, expect caller to pass subtotal/shipping/tax precomputed from Lulu quote
      if (typeof body?.subtotalCents !== 'number') {
        return NextResponse.json({ error: 'subtotalCents required for print' }, { status: 400 });
      }
      subtotalCents = Math.max(0, Math.floor(body.subtotalCents));
      name = 'Printed Book (Lulu pass-through)';
    }

    const totalCents = subtotalCents + shippingCents + taxCents;

    // Record order (pending)
    const order = await BriefDB.createOrder(profile.id, {
      book_id: bookId,
      type,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      status: 'pending',
    });

    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/order/complete?order_id=${order.id}&type=${type}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?type=${type}&canceled=1`,
      metadata: {
        order_id: order.id,
        type,
        book_id: bookId || '',
        clerk_id: clerkId,
        referral_code: referralCode || '',
      },
    });

    // Return URL to redirect
    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

