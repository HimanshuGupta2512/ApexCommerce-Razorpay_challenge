import fs from 'fs';
import path from 'path';
import https from 'https';

const productsFile = path.join(__dirname, '../src/data/products.json');
const publicDir = path.join(__dirname, '../public');
const productsDir = path.join(publicDir, 'products');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Ensure "Licensed Bamboo Bike" exists
let products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

let bikeIndex = products.findIndex((p: any) => p.name === 'Licensed Bamboo Bike');
if (bikeIndex === -1) {
  bikeIndex = products.findIndex((p: any) => p.name.includes('Bike'));
  if (bikeIndex !== -1) {
    products[bikeIndex].name = 'Licensed Bamboo Bike';
  } else {
    // just rename the first one
    bikeIndex = 0;
    products[0].name = 'Licensed Bamboo Bike';
  }
}

// Let's pick 5 other products
const selectedIndices = [bikeIndex];
const desiredNames = [
  { index: bikeIndex, name: 'Licensed Bamboo Bike', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=640', ext: '.jpg' },
];

const targetKeywords = [
  { keyword: 'Keyboard', url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=640' },
  { keyword: 'Mouse', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=640' },
  { keyword: 'Towels', url: 'https://images.unsplash.com/photo-1616174828330-80415a77cc5f?q=80&w=640' },
  { keyword: 'Car', url: 'https://images.unsplash.com/photo-1510166089176-b57564a5b7d1?q=80&w=640' },
  { keyword: 'Fish', url: 'https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?q=80&w=640' }
];

for (const target of targetKeywords) {
  let idx = products.findIndex((p: any, i: number) => !selectedIndices.includes(i) && p.name.includes(target.keyword));
  if (idx === -1) {
    // If not found, just pick any available and rename it
    idx = products.findIndex((p: any, i: number) => !selectedIndices.includes(i));
    products[idx].name = `Awesome ${target.keyword}`;
  }
  selectedIndices.push(idx);
  desiredNames.push({ index: idx, name: products[idx].name, url: target.url, ext: '.jpg' });
}

// Download function
const downloadImage = (url: string, filepath: string) => {
  return new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location!, filepath).then(resolve).catch(reject);
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
      stream.on('error', reject);
    }).on('error', reject);
  });
};

const run = async () => {
  for (let i = 0; i < desiredNames.length; i++) {
    const item = desiredNames[i];
    const filename = `product-${i + 1}${item.ext}`;
    const filepath = path.join(productsDir, filename);
    console.log(`Downloading image for ${item.name} from ${item.url} to ${filepath}`);
    await downloadImage(item.url, filepath);
    
    products[item.index].imageUrl = `/products/${filename}`;
  }
  
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
  console.log('Updated products.json with local image URLs.');
};

run().catch(console.error);
