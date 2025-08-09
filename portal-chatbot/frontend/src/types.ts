export type Conversation = { id: number; title: string; created_at: string };
export type Message = {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql_executed?: string | null;
  results_json?: string | null;
  created_at?: string;
};
export type Schema = Record<string, { columns: Array<{ name: string; type: string }> }>;