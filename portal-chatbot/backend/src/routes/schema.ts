import { Router } from 'express';
import { pool } from '../utils/db';
import { env } from '../utils/config';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [tables] = await pool.query<any[]>(
      'SELECT TABLE_NAME as tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
      [env.MYSQL_DB]
    );
    const tableNames = (tables as any[]).map((t) => t.tableName);

    const schema: Record<string, { columns: Array<{ name: string; type: string }>; rowEstimate?: number }> = {};

    for (const name of tableNames) {
      const [cols] = await pool.query<any[]>(
        'SELECT COLUMN_NAME as name, COLUMN_TYPE as type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
        [env.MYSQL_DB, name]
      );
      schema[name] = { columns: cols as Array<{ name: string; type: string }> };
    }

    res.json({ schema });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to load schema' });
  }
});

export default router;