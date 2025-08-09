import React from 'react';
import { Schema } from '../types';

type Props = { schema: Schema };

export default function SchemaPanel({ schema }: Props) {
  const entries = Object.entries(schema);
  return (
    <div className="schema">
      <h3>Database Schema</h3>
      {entries.length === 0 && <div className="small">No schema loaded</div>}
      {entries.map(([table, def]) => (
        <div key={table} className="table">
          <h4>{table}</h4>
          <div className="code">
            {def.columns.map((c) => (
              <div key={c.name}>{c.name} {c.type}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}