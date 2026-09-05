import fs from 'fs';
import path from 'path';

// A simple local Embeddings implementation that doesn't need an API key
class LocalBagOfWordsEmbeddings {
  private vocab: Map<string, number> = new Map();
  private maxDim = 500;

  embedDocuments(documents: string[]): number[][] {
    return documents.map(doc => this.getVector(doc));
  }

  embedQuery(document: string): number[] {
    return this.getVector(document);
  }

  private getVector(text: string): number[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const vec = new Array(this.maxDim).fill(0);
    for (const word of words) {
      let idx = this.vocab.get(word);
      if (idx === undefined) {
        idx = this.vocab.size % this.maxDim;
        this.vocab.set(word, idx);
      }
      vec[idx] += 1;
    }
    // Normalize
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vec.map(v => v / norm) : vec;
  }
}

// Global cached stores
const embeddings = new LocalBagOfWordsEmbeddings();

let catalogDocs: Array<{ content: string, metadata: any, vector: number[] }> = [];
let policyDocs: Array<{ content: string, metadata: any, vector: number[] }> = [];

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

export async function indexCatalog() {
  if (catalogDocs.length > 0) return;
  const dataPath = path.join(process.cwd(), 'src/data/products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const documents = products.map((p: any) => ({
    content: `${p.name} ${p.category} ${p.description} ${p.compatibility_tags.join(' ')}`,
    metadata: { id: p.id, price: p.price, stock: p.stock, name: p.name, imageUrl: p.imageUrl, description: p.description }
  }));

  const vectors = embeddings.embedDocuments(documents.map((d: any) => d.content));
  catalogDocs = documents.map((d: any, i: number) => ({
    ...d,
    vector: vectors[i]
  }));
}

export async function indexPolicies() {
  if (policyDocs.length > 0) return;
  const dataPath = path.join(process.cwd(), 'src/data/policies.md');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  const sections = content.split('## ').slice(1);
  const documents = sections.map((s: string) => ({
    content: s,
    metadata: { source: 'policies' }
  }));

  const vectors = embeddings.embedDocuments(documents.map((d: any) => d.content));
  policyDocs = documents.map((d: any, i: number) => ({
    ...d,
    vector: vectors[i]
  }));
}

export async function searchCatalog(query: string, limit = 4) {
  await indexCatalog();
  const queryVec = embeddings.embedQuery(query);
  const scored = catalogDocs.map(doc => ({
    ...doc.metadata,
    content: doc.content,
    score: cosineSimilarity(queryVec, doc.vector)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function searchPolicies(query: string, limit = 2) {
  await indexPolicies();
  const queryVec = embeddings.embedQuery(query);
  const scored = policyDocs.map(doc => ({
    ...doc.metadata,
    content: doc.content,
    score: cosineSimilarity(queryVec, doc.vector)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
