import { Router } from 'express';
import { pingDatabase } from '../utils/db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const dbOk = await pingDatabase();
    res.json({ ok: true, db: dbOk });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'unknown' });
  }
});

export default router;