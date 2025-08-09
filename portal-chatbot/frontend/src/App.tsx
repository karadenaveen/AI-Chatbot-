import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import SchemaPanel from './components/SchemaPanel';
import { Conversation, Message, Schema } from './types';
import { createConversation, fetchSchema, listConversations, listMessages, sendMessage } from './lib/api';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [schema, setSchema] = useState<Schema>({});
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    const list = await listConversations();
    setConversations(list);
    if (list.length && activeId == null) {
      setActiveId(list[0].id);
    }
  };

  const loadMessages = async (id: number) => {
    const data = await listMessages(id);
    setMessages(data);
  };

  useEffect(() => {
    loadConversations();
    fetchSchema().then(setSchema).catch(() => setSchema({}));
  }, []);

  useEffect(() => {
    if (activeId != null) loadMessages(activeId);
  }, [activeId]);

  const onCreate = async () => {
    const title = `Conversation ${new Date().toLocaleString()}`;
    const convo = await createConversation(title);
    await loadConversations();
    setActiveId(convo.id);
    setMessages([]);
  };

  const onSend = async (content: string) => {
    if (activeId == null) return;
    setSending(true);
    try {
      setMessages((prev) => [...prev, { role: 'user', content }]);
      const reply = await sendMessage(activeId, content);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.content, sql_executed: reply.sql_executed, results_json: reply.results_json }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId ?? undefined}
        onSelect={(id) => setActiveId(id)}
        onCreate={onCreate}
      />
      <Chat messages={messages} onSend={onSend} sending={sending} />
      <SchemaPanel schema={schema} />
    </div>
  );
}