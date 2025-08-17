import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { BriefDB } from '@/lib/services/database';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });

  let event: Stripe.Event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = (session.metadata?.order_id as string) || '';
        const type = (session.metadata?.type as string) || '';
        const clerkId = (session.metadata?.clerk_id as string) || '';
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        const amountTotal = session.amount_total || 0;

        if (orderId) {
          await BriefDB.updateOrder(orderId, {
            status: 'paid',
            stripe_pi: paymentIntentId || null,
            total_cents: amountTotal,
          });
        }

        // Award loyalty points for paid digital full book orders (+10)
        if (type === 'digital' && clerkId) {
          const profile = await BriefDB.getProfileByClerk(clerkId);
          if (profile) {
            await BriefDB.incrementPoints(profile.id, 10);
          }
        }

        break;
      }
      case 'payment_intent.payment_failed':
      case 'checkout.session.expired': {
        // Mark order as failed if we have a reference
        const session = event.data.object as any;
        const orderId = session?.metadata?.order_id as string | undefined;
        if (orderId) {
          await BriefDB.updateOrder(orderId, { status: 'failed' });
        }
        break;
      }
      default:
        // No-op for other events
        break;
    }
  } catch (err) {
    console.error('Webhook handling error:', err);
    return NextResponse.json({ received: true, error: 'handler_error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

