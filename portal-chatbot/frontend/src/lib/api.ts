import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3001';
export const api = axios.create({ baseURL });

export async function listConversations() {
  const { data } = await api.get('/api/conversations');
  return data.conversations;
}

export async function createConversation(title: string) {
  const { data } = await api.post('/api/conversations', { title });
  return data;
}

export async function listMessages(conversationId: number) {
  const { data } = await api.get(`/api/conversations/${conversationId}/messages`);
  return data.messages;
}

export async function sendMessage(conversationId: number, content: string) {
  const { data } = await api.post(`/api/conversations/${conversationId}/messages`, { content });
  return data.message;
}

export async function fetchSchema() {
  const { data } = await api.get('/api/schema');
  return data.schema as Record<string, { columns: Array<{ name: string; type: string }> }>;
}