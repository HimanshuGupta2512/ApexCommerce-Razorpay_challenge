import { NextRequest, NextResponse } from 'next/server';
import { validateCheckout } from '@/lib/guardrails/gatekeeper';
import { razorpay } from '@/lib/razorpay';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode } = await req.json();

    // 1. Strict Validation via Gatekeeper
    const validation = await validateCheckout(items, couponCode);

    if (!validation.isValid || !validation.canonicalCart) {
      return NextResponse.json({ error: validation.rejectionReason }, { status: 400 });
    }

    // 2. Draft Order Generation in Prisma
    const orderRecord = await db.order.create({
      data: {
        amount: validation.canonicalCart.finalAmountPaise,
        status: 'pending',
        currency: 'INR',
        items: {
          create: validation.canonicalCart.items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price * 100, // storing price in paise
            quantity: item.quantity,
          }))
        }
      }
    });

    // Generate compliant receipt (max 40 chars)
    // 'rcpt_' is 5 chars, UUID without dashes is 32 chars => 37 chars total
    const receiptId = `rcpt_${orderRecord.id.replace(/-/g, '')}`;
    
    // Update the record with receipt
    await db.order.update({
      where: { id: orderRecord.id },
      data: { receipt: receiptId }
    });

    // 3. Create Razorpay Order
    const options = {
      amount: validation.canonicalCart.finalAmountPaise, // Strict paise amount from gatekeeper
      currency: "INR",
      receipt: receiptId,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 4. Save Razorpay ID
    await db.order.update({
      where: { id: orderRecord.id },
      data: { razorpayId: razorpayOrder.id }
    });

    return NextResponse.json({ 
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: receiptId
    });
  } catch (error: any) {
    console.error('Payment Error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
