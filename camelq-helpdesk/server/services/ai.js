import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { retrieveRelevantChunks } from './embeddings.js';

dotenv.config();

const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
const openai = hasApiKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const faqsPath = path.resolve(__dirname, '..', 'data', 'faqs.json');

function loadFaqs() {
  try {
    const raw = fs.readFileSync(faqsPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function simpleRelevanceScore(query, text) {
  if (!query || !text) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let score = 0;
  for (const token of q.split(/\W+/).filter(Boolean)) {
    if (t.includes(token)) score += 1;
  }
  return score;
}

function retrieveTopFaqs(query, limit = 5) {
  const faqs = loadFaqs();
  const ranked = faqs
    .map((f) => ({ faq: f, score: simpleRelevanceScore(query, `${f.question} ${f.answer}`) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.faq);
  return ranked;
}

export async function generateAssistantReply({ sessionId, message, history }) {
  const topFaqs = retrieveTopFaqs(message, 6);
  const retrieved = await retrieveRelevantChunks(message, { topK: 6 });

  const systemPrompt = `You are CamelQ's AI Helpdesk assistant. Be concise, friendly, and factual. If unsure, ask a clarifying question. Prefer citing or paraphrasing the provided CamelQ website context. If a policy or pricing is unknown, recommend contacting support at support@camelq.com.`;

  const kbFaqContext = topFaqs
    .map((f, i) => `FAQ${i + 1} Q: ${f.question}\nFAQ${i + 1} A: ${f.answer}`)
    .join('\n\n');

  const siteContext = (retrieved || [])
    .map((c, i) => `DOC${i + 1} Title: ${c.title || ''}\nDOC${i + 1} URL: ${c.url || ''}\nDOC${i + 1} Excerpt: ${c.text}`)
    .join('\n\n');

  if (!hasApiKey) {
    const first = topFaqs[0];
    if (first) {
      return `Based on our knowledge: ${first.answer}`;
    }
    return "I'm ready to help. Please configure the AI key to enable richer answers, or ask something else about CamelQ.";
  }

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  if (kbFaqContext) {
    messages.push({ role: 'system', content: `FAQs:\n\n${kbFaqContext}` });
  }

  if (siteContext) {
    messages.push({ role: 'system', content: `CamelQ Site Context:\n\n${siteContext}` });
  }

  for (const m of history || []) {
    if (m && typeof m.role === 'string' && typeof m.content === 'string') {
      messages.push({ role: m.role, content: m.content });
    }
  }

  messages.push({ role: 'user', content: message });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim() || "I'm here to help!";
  return reply;
}