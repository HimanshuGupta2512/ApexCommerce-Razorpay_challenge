import fs from 'fs';
import path from 'path';
import { logAuditEvent } from './logger';

export interface GatekeeperResult {
  isValid: boolean;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  canonicalCart?: {
    items: Array<{ id: string; name: string; price: number; quantity: number; total: number }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    finalAmountINR: number;
    finalAmountPaise: number;
  };
  auditLogId?: string;
}

interface CartItem {
  productId: string;
  quantity: number;
  price?: number; // client provided price, should not be trusted
}

const getCanonicalProducts = () => {
  const dataPath = path.join(process.cwd(), 'src/data/products.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
};

export async function validateCheckout(
  cartItems: CartItem[], 
  couponCode?: string, 
  metadata?: any
): Promise<GatekeeperResult> {
  // Rule 0: Cart cannot be empty
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    const reason = 'Cart cannot be empty.';
    const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems }, reason, metadata });
    return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
  }

  const products = getCanonicalProducts();
  const canonicalItems = [];
  
  // Aggregate quantities to prevent duplicate line item stock bypass
  const aggregatedQuantities: Record<string, number> = {};
  const itemPrices: Record<string, number | undefined> = {};

  for (const item of cartItems) {
    // Rule 1: Validate quantity shape (positive integers only)
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isSafeInteger(item.quantity)) {
      const reason = `Invalid quantity for product ${item.productId}. Must be a positive integer.`;
      const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems }, reason, metadata });
      return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
    }
    
    aggregatedQuantities[item.productId] = (aggregatedQuantities[item.productId] || 0) + item.quantity;
    
    if (item.price !== undefined) {
      if (itemPrices[item.productId] !== undefined && itemPrices[item.productId] !== item.price) {
        const reason = `Conflicting prices provided for product ${item.productId}.`;
        const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems }, reason, metadata });
        return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
      }
      itemPrices[item.productId] = item.price;
    }
  }

  let subtotalPaise = 0;

  for (const [productId, quantity] of Object.entries(aggregatedQuantities)) {
    const product = products.find((p: any) => p.id === productId);
    
    // Rule 2: Product Exists
    if (!product) {
      const reason = `Product ${productId} not found in canonical database.`;
      const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems }, reason, metadata });
      return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
    }

    // Rule 3: Stock Check (using aggregated quantity)
    if (quantity > product.stock) {
      const reason = `Requested quantity ${quantity} for ${product.name} exceeds available stock ${product.stock}.`;
      const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems }, reason, metadata });
      return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
    }
    
    // Rule 4: Zero-Trust Pricing
    const providedPrice = itemPrices[productId];
    if (providedPrice !== undefined && providedPrice !== product.price) {
      const reason = `Price tampering detected for ${product.name}. Client requested ₹${providedPrice}, canonical price is ₹${product.price}.`;
      const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems }, reason, metadata });
      return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
    }

    // Calculate in integers (paise)
    const pricePaise = product.price * 100;
    const totalPaise = pricePaise * quantity;
    subtotalPaise += totalPaise;

    canonicalItems.push({
      id: product.id,
      name: product.name,
      price: product.price, // keep INR for response formatting
      quantity,
      total: totalPaise / 100, // keep INR for response formatting
    });
  }

  // Rule 5: Coupon Validation (Calculations in paise)
  let discountAmountPaise = 0;
  if (couponCode) {
    const code = couponCode.toUpperCase();
    if (code === 'SAVE10') {
      if (subtotalPaise >= 2000_00) {
        // 10% discount, max 1000 INR (100000 paise)
        discountAmountPaise = Math.min(Math.floor(subtotalPaise / 10), 1000_00);
      } else {
        const reason = `Coupon SAVE10 requires minimum cart value of ₹2000.`;
        const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems, couponCode }, reason, metadata });
        return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
      }
    } else if (code === 'WELCOME500') {
      if (subtotalPaise >= 5000_00) {
        discountAmountPaise = 500_00;
      } else {
        const reason = `Coupon WELCOME500 requires minimum cart value of ₹5000.`;
        const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems, couponCode }, reason, metadata });
        return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
      }
    } else {
      const reason = `Invalid or unauthorized coupon code: ${couponCode}.`;
      const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems, couponCode }, reason, metadata });
      return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
    }
  }

  // GST 18% calculation
  const taxableAmountPaise = subtotalPaise - discountAmountPaise;
  const taxAmountPaise = Math.round((taxableAmountPaise * 18) / 100);
  const finalAmountPaise = taxableAmountPaise + taxAmountPaise;
  
  if (!Number.isSafeInteger(finalAmountPaise) || finalAmountPaise <= 0) {
    const reason = 'Invalid final payable amount.';
    const auditLogId = await logAuditEvent({ action: 'checkout_stage', status: 'REJECTED', payload: { cartItems, couponCode }, reason, metadata, });
    return { isValid: false, status: 'REJECTED', rejectionReason: reason, auditLogId };
  }
  
  const finalAmountINR = finalAmountPaise / 100;

  const canonicalCart = {
    items: canonicalItems,
    subtotal: subtotalPaise / 100,
    discountAmount: discountAmountPaise / 100,
    taxAmount: taxAmountPaise / 100,
    finalAmountINR,
    finalAmountPaise,
  };

  const auditLogId = await logAuditEvent({ 
    action: 'checkout_stage', 
    status: 'APPROVED', 
    payload: { cartItems, couponCode, canonicalCart }, 
    metadata 
  });

  return {
    isValid: true,
    status: 'APPROVED',
    canonicalCart,
    auditLogId
  };
}
