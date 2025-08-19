#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcesPath = path.resolve(__dirname, '..', 'data', 'sources.jsonl');
const outPath = path.resolve(__dirname, '..', 'data', 'embeddings.json');
const EMBEDDING_MODEL = 'text-embedding-3-small';

function* readJsonl(file) {
  const data = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8').split('\n') : [];
  for (const line of data) {
    const l = line.trim();
    if (!l) continue;
    try { yield JSON.parse(l); } catch { /* ignore */ }
  }
}

function chunkText(text, { maxChars = 2500, overlap = 200 } = {}) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 200) chunks.push(chunk);
    start = end - overlap;
    if (start < 0) start = 0;
    if (start >= text.length) break;
  }
  return chunks;
}

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is required to build embeddings.');
    process.exit(1);
  }
  const client = new OpenAI({ apiKey });

  const vectors = [];
  for (const { url, title, text } of readJsonl(sourcesPath)) {
    const chunks = chunkText(text);
    for (const chunk of chunks) {
      const emb = await client.embeddings.create({ model: EMBEDDING_MODEL, input: chunk });
      const embedding = emb.data?.[0]?.embedding;
      if (!embedding) continue;
      vectors.push({ url, title, text: chunk, embedding });
      process.stdout.write('.');
    }
  }
  const payload = { model: EMBEDDING_MODEL, vectors };
  fs.writeFileSync(outPath, JSON.stringify(payload));
  console.log(`\nWrote ${vectors.length} chunks to ${outPath}`);
}

run().catch((e) => { console.error(e); process.exit(1); });