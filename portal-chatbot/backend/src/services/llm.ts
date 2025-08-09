import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { env } from '../utils/config';

const systemPromptPath = path.join(__dirname, '../prompts/systemPrompt.txt');
const systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

type ChatHistoryItem = { role: 'system' | 'user' | 'assistant'; content: string };

export async function proposeSqlAndAnswer(
  userMessage: string,
  history: ChatHistoryItem[],
  schemaText: string
): Promise<{ assistantText: string; proposedSql?: string }> {
  if (!client) {
    const proposedSql = naiveSqlHeuristic(userMessage);
    const assistantText = proposedSql
      ? `I can run the following read-only SQL on ${env.COMPANY_NAME}'s database to answer your question:\n\n${"```sql\n" + proposedSql + "\n```"}`
      : `How can I help you explore ${env.COMPANY_NAME}'s database? You can ask questions like "List the latest 10 orders" or "Show customers in the business segment".`;
    return { assistantText, proposedSql };
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: `${systemPrompt}\n\nCompany: ${env.COMPANY_NAME}\n\nSCHEMA:\n${schemaText}` },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content } as any)),
    { role: 'user', content: userMessage },
  ];

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content || 'I could not generate a response.';

  // Extract first SQL block if present
  const sqlMatch = content.match(/```sql\s*([\s\S]*?)```/i);
  const proposedSql = sqlMatch ? sqlMatch[1].trim() : undefined;

  return { assistantText: content, proposedSql };
}

function naiveSqlHeuristic(input: string): string | undefined {
  const q = input.toLowerCase();
  if (q.includes('latest') && q.includes('orders')) return 'SELECT * FROM orders ORDER BY order_date DESC LIMIT 10';
  if (q.includes('customers') && (q.includes('business') || q.includes('segment'))) return "SELECT id, name, email, segment FROM customers WHERE segment = 'business' LIMIT 50";
  if (q.includes('products')) return 'SELECT id, sku, name, category, price FROM products LIMIT 50';
  return undefined;
}