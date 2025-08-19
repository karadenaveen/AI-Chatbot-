import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const embeddingsFile = path.resolve(__dirname, '..', 'data', 'embeddings.json');

const EMBEDDING_MODEL = 'text-embedding-3-small';

function loadEmbeddings() {
  try {
    const raw = fs.readFileSync(embeddingsFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { model: EMBEDDING_MODEL, vectors: [] };
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieveRelevantChunks(query, { topK = 6 } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];
  const store = loadEmbeddings();
  if (!store.vectors?.length) return [];

  const client = new OpenAI({ apiKey });
  const embed = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const qvec = embed.data?.[0]?.embedding;
  if (!qvec) return [];

  const scored = store.vectors.map((v) => ({ ...v, score: cosineSimilarity(qvec, v.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ text, url, title, score }) => ({ text, url, title, score }));
}