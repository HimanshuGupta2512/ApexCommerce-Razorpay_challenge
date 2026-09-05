import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/guardrails/logger';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Hard fail if secret is missing to prevent fail-open forge attacks
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const bodyString = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');
    
    if (
      receivedBuffer.length !== expectedBuffer.length || 
      !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyString);
    const eventId = event.id; // Log webhook event ID for idempotency/replay tracking
    const paymentEntity = event.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;

    if (!razorpayOrderId) {
      return NextResponse.json({ received: true });
    }

    // Fetch local order for amount verification and strict state transition checks
    const localOrder = await db.order.findUnique({
      where: { razorpayId: razorpayOrderId }
    });

    if (!localOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Audit log the incoming webhook
    await logAuditEvent({
      action: `webhook_${event.event}`,
      status: 'APPROVED',
      payload: { eventId, razorpayOrderId },
      metadata: { event }
    });

    // Guard state transitions
    if (event.event === 'payment.captured') {
      // 1. Guard against replay and enforce strict sequence
      if (localOrder.status === 'paid') {
        return NextResponse.json({ received: true, message: 'Already paid' });
      }
      if (localOrder.status !== 'pending') {
        return NextResponse.json({ error: 'Invalid state transition' }, { status: 400 });
      }

      // 2. Exact amount and currency match
      if (paymentEntity.amount !== localOrder.amount || paymentEntity.currency !== localOrder.currency) {
        await logAuditEvent({
          action: `webhook_amount_mismatch`,
          status: 'REJECTED',
          payload: { 
            expectedAmount: localOrder.amount, expectedCurrency: localOrder.currency,
            receivedAmount: paymentEntity.amount, receivedCurrency: paymentEntity.currency
          },
          reason: 'Captured amount or currency does not match local order',
        });
        return NextResponse.json({ error: 'Amount/Currency mismatch' }, { status: 400 });
      }

      // 3. Mark paid
      await db.order.update({
        where: { id: localOrder.id },
        data: { status: 'paid' },
      });
    } else if (event.event === 'payment.failed') {
      // Prevent downgrade attack
      if (localOrder.status === 'paid') {
        return NextResponse.json({ received: true, message: 'Cannot fail an already paid order' });
      }

      await db.order.update({
        where: { id: localOrder.id },
        data: { status: 'failed' },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
