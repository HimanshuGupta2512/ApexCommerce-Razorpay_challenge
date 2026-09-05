import { searchCatalog } from '../src/lib/rag/engine';
import { validateCheckout } from '../src/lib/guardrails/gatekeeper';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('--- Starting Phase 2 Tests ---\n');

  // Test 1: RAG Semantic Search
  console.log('[Test 1] RAG Semantic Search');
  const results = await searchCatalog('gaming', 2);
  console.log(`Found ${results.length} results for 'gaming':`);
  results.forEach(r => console.log(` - ${r.name} (Score: ${r.score.toFixed(4)})`));
  if (results.length > 0) {
    console.log('✅ RAG Search passed.\n');
  } else {
    console.log('❌ RAG Search failed to find anything.\n');
  }

  // Get a product for checkout tests
  const dataPath = path.join(process.cwd(), 'src/data/products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  // Find a product with stock >= 1 and price >= 2000 to guarantee SAVE10 works
  const expensiveProduct = products.find((p: any) => p.price >= 2000 && p.stock >= 1);
  const testProduct = expensiveProduct || products[0]; 

  // Test 2: Gatekeeper Valid Checkout Test
  console.log('[Test 2] Gatekeeper Valid Checkout Test (SAVE10)');
  
  const validCart = [{ productId: testProduct.id, quantity: 1 }];
  // If we couldn't find an expensive enough product (unlikely), we might not pass SAVE10
  const coupon = testProduct.price >= 2000 ? 'SAVE10' : undefined;

  const validRes = await validateCheckout(validCart, coupon);
  
  if (validRes.status === 'APPROVED') {
    console.log('✅ Valid Checkout passed. AuditLog ID:', validRes.auditLogId);
    console.log('   Final Paise:', validRes.canonicalCart?.finalAmountPaise);
  } else {
    console.log('❌ Valid Checkout failed. Reason:', validRes.rejectionReason);
  }
  console.log('');

  // Test 3: Price Tampering Attack
  console.log('[Test 3] Price Tampering Attack Simulation');
  const tamperedCart = [{ productId: testProduct.id, quantity: 1, price: 100 }];
  const tamperedRes = await validateCheckout(tamperedCart);
  if (tamperedRes.status === 'REJECTED') {
    console.log('✅ Price Tampering correctly intercepted.');
    console.log('   Reason:', tamperedRes.rejectionReason);
    console.log('   AuditLog ID:', tamperedRes.auditLogId);
  } else {
    console.log('❌ Price Tampering was NOT caught.');
  }
  console.log('');

  // Test 4: Invalid Coupon Attack
  console.log('[Test 4] Invalid Coupon Attack Simulation');
  const invalidCouponCart = [{ productId: testProduct.id, quantity: 1 }];
  const invalidCouponRes = await validateCheckout(invalidCouponCart, 'HACKER99');
  if (invalidCouponRes.status === 'REJECTED') {
    console.log('✅ Invalid Coupon correctly intercepted.');
    console.log('   Reason:', invalidCouponRes.rejectionReason);
    console.log('   AuditLog ID:', invalidCouponRes.auditLogId);
  } else {
    console.log('❌ Invalid Coupon was NOT caught.');
  }
  console.log('\n--- Phase 2 Tests Completed ---');
}

runTests().catch(console.error);
