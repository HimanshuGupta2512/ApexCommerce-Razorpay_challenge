import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  compatibility_tags: string[];
}

const generateProducts = (): Product[] => {
  const products: Product[] = [];
  const categories = ['Electronics', 'Accessories', 'Audio', 'Wearables', 'Computers'];
  const tags = ['Bluetooth', 'Wireless', 'USB-C', 'Portable', 'Gaming', 'Office', 'Smart Home'];

  for (let i = 0; i < 150; i++) {
    const product: Product = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: parseInt(faker.commerce.price({ min: 500, max: 150000, dec: 0 })),
      category: faker.helpers.arrayElement(categories),
      stock: faker.number.int({ min: 0, max: 100 }),
      description: faker.commerce.productDescription(),
      compatibility_tags: faker.helpers.arrayElements(tags, { min: 1, max: 3 }),
    };
    products.push(product);
  }
  return products;
};

const main = () => {
  const products = generateProducts();
  const dirPath = path.join(__dirname, '../src/data');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, 'products.json');
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log(`Successfully generated 150 products at ${filePath}`);
  
  const policiesPath = path.join(dirPath, 'policies.md');
  const policiesContent = `# ApexCommerce Policies

## 1. Return Policy
- Items can be returned within 14 days of delivery.
- Must be in original packaging and condition.
- Refunds will be processed within 5-7 business days after inspection.
- Clearance items and digital products are non-refundable.

## 2. Warranty Information
- All electronics come with a standard 1-year manufacturer warranty.
- Extended warranties are available for purchase within 30 days of the original purchase.
- Physical damage or water damage is not covered under warranty.

## 3. Discount Bounds & Rules
- Maximum allowable discount on any single order is 20%.
- Discount codes cannot be stacked.
- Discounts do not apply to clearance or already discounted items.
- Support agents can only authorize discounts up to 10% without managerial approval.
`;
  fs.writeFileSync(policiesPath, policiesContent);
  console.log(`Successfully generated policies at ${policiesPath}`);
};

main();
