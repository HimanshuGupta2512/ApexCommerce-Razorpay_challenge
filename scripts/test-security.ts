import { searchCatalog } from '../src/lib/rag/engine';
import { validateCheckout } from '../src/lib/guardrails/gatekeeper';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('--- Starting Phase 2 Security Tests ---\n');

  const dataPath = path.join(process.cwd(), 'src/data/products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const testProduct = products[0]; 

  // Test 1: Empty cart
  console.log('[Test 1] Empty cart validation');
  const res1 = await validateCheckout([]);
  if (res1.status === 'REJECTED' && res1.rejectionReason?.includes('empty')) {
    console.log('✅ Empty cart rejected.');
  } else {
    console.log('❌ Empty cart test failed.', res1);
  }

  // Test 2: Negative quantity
  console.log('[Test 2] Negative quantity validation');
  const res2 = await validateCheckout([{ productId: testProduct.id, quantity: -1 }]);
  if (res2.status === 'REJECTED' && res2.rejectionReason?.includes('Invalid quantity')) {
    console.log('✅ Negative quantity rejected.');
  } else {
    console.log('❌ Negative quantity test failed.', res2);
  }

  // Test 3: Zero quantity
  console.log('[Test 3] Zero quantity validation');
  const res3 = await validateCheckout([{ productId: testProduct.id, quantity: 0 }]);
  if (res3.status === 'REJECTED' && res3.rejectionReason?.includes('Invalid quantity')) {
    console.log('✅ Zero quantity rejected.');
  } else {
    console.log('❌ Zero quantity test failed.', res3);
  }

  // Test 4: Fractional quantity
  console.log('[Test 4] Fractional quantity validation');
  const res4 = await validateCheckout([{ productId: testProduct.id, quantity: 0.5 }]);
  if (res4.status === 'REJECTED' && res4.rejectionReason?.includes('Invalid quantity')) {
    console.log('✅ Fractional quantity rejected.');
  } else {
    console.log('❌ Fractional quantity test failed.', res4);
  }

  // Test 5: Duplicate line items exceeding stock
  console.log('[Test 5] Duplicate line items exceeding stock');
  const inStockProduct = products.find((p: any) => p.stock > 0);
  const totalStock = inStockProduct.stock;
  const res5 = await validateCheckout([
    { productId: inStockProduct.id, quantity: totalStock },
    { productId: inStockProduct.id, quantity: 1 }
  ]);
  
  if (res5.status === 'REJECTED' && res5.rejectionReason?.includes('exceeds available stock')) {
    console.log('✅ Duplicate line items correctly aggregated and rejected.');
  } else {
    console.log('❌ Duplicate line items test failed.', res5);
  }
}

runTests().catch(console.error);
