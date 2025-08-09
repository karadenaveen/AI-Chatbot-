import { Router } from 'express';
import { pool } from '../utils/db';
import { validateSql } from '../utils/sqlSafety';
import { proposeSqlAndAnswer } from '../services/llm';
import { env } from '../utils/config';

const router = Router();

router.get('/conversations', async (_req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, title, created_at FROM conversations ORDER BY created_at DESC');
    res.json({ conversations: rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to list conversations' });
  }
});

router.post('/conversations', async (req, res) => {
  const title: string = (req.body?.title || 'New Conversation').toString().slice(0, 255);
  try {
    const [result] = await pool.query<any>('INSERT INTO conversations (title) VALUES (?)', [title]);
    res.status(201).json({ id: (result as any).insertId, title });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to create conversation' });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT id, role, content, sql_executed, results_json, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC',
      [id]
    );
    res.json({ messages: rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to list messages' });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const content: string = (req.body?.content || '').toString();
  if (!content.trim()) return res.status(400).json({ error: 'Empty message' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('INSERT INTO messages (conversation_id, role, content) VALUES (?, "user", ?)', [id, content]);

    // Load recent messages for context
    const [history] = await conn.query<any[]>(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC LIMIT 20',
      [id]
    );

    // Load schema snapshot
    const [tables] = await conn.query<any[]>(
      'SELECT TABLE_NAME as tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
      [env.MYSQL_DB]
    );
    const tableNames = (tables as any[]).map((t) => t.tableName);
    const schemaParts: string[] = [];
    for (const name of tableNames) {
      const [cols] = await conn.query<any[]>(
        'SELECT COLUMN_NAME as name, COLUMN_TYPE as type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
        [env.MYSQL_DB, name]
      );
      const colsText = (cols as any[]).map((c) => `${c.name} ${c.type}`).join(', ');
      schemaParts.push(`${name}(${colsText})`);
    }
    const schemaText = schemaParts.join('\n');

    const { assistantText, proposedSql } = await proposeSqlAndAnswer(content, history as any[], schemaText);

    let sqlExecuted: string | null = null;
    let resultsJson: string | null = null;

    if (proposedSql) {
      const validation = validateSql(proposedSql);
      if (validation.ok && validation.safeSql) {
        if (env.AUTO_EXECUTE_SQL) {
          try {
            const [rows] = await conn.query<any[]>(validation.safeSql);
            resultsJson = JSON.stringify(rows?.slice(0, env.MAX_QUERY_ROWS) || []);
            sqlExecuted = validation.safeSql;
          } catch (e: any) {
            resultsJson = JSON.stringify({ error: e?.message || 'Query failed' });
            sqlExecuted = validation.safeSql;
          }
        } else {
          sqlExecuted = validation.safeSql;
        }
      }
    }

    await conn.query(
      'INSERT INTO messages (conversation_id, role, content, sql_executed, results_json) VALUES (?, "assistant", ?, ?, ?)',
      [id, assistantText, sqlExecuted, resultsJson]
    );

    await conn.commit();

    res.status(201).json({ message: { role: 'assistant', content: assistantText, sql_executed: sqlExecuted, results_json: resultsJson } });
  } catch (e: any) {
    await conn.rollback();
    res.status(500).json({ error: e?.message || 'Failed to process message' });
  } finally {
    conn.release();
  }
});

export default router;