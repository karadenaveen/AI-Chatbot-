import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

type Props = {
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  sending: boolean;
};

export default function Chat({ messages, onSend, sending }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    await onSend(value);
  };

  return (
    <div className="main">
      <div className="header">
        <div>Chat</div>
      </div>
      <div className="chat">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {messages.map((m, idx) => (
            <div key={idx} className={`message ${m.role}`}>
              <div style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{m.content}</div>
              {m.sql_executed && (
                <div>
                  <div className="small">SQL</div>
                  <pre className="code" style={{ whiteSpace: 'pre-wrap' }}>{m.sql_executed}</pre>
                </div>
              )}
              {m.results_json && (
                <div>
                  <div className="small">Results</div>
                  <pre className="code" style={{ whiteSpace: 'pre-wrap' }}>{m.results_json}</pre>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="input">
        <textarea
          placeholder="Ask about customers, orders, products..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button onClick={send} disabled={sending || !text.trim()}>{sending ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  );
}