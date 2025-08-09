import React from 'react';
import { Conversation } from '../types';

type Props = {
  conversations: Conversation[];
  activeId?: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
};

export default function Sidebar({ conversations, activeId, onSelect, onCreate }: Props) {
  return (
    <div className="sidebar">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={onCreate}>New Chat</button>
      </div>
      {conversations.map((c) => (
        <div
          key={c.id}
          className={`convo ${activeId === c.id ? 'active' : ''}`}
          onClick={() => onSelect(c.id)}
        >
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div className="small">{new Date(c.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}