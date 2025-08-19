import express from 'express';
import { readAllSources, getSourceById, updateSourceById } from '../services/storage.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

function requireAdmin(req, res, next) {
	const token = req.headers['x-admin-token'] || req.query.token;
	if (!process.env.ADMIN_TOKEN) return res.status(500).json({ error: 'ADMIN_TOKEN not set' });
	if (!token || token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
	next();
}

router.get('/docs', requireAdmin, (req, res) => {
	const all = readAllSources();
	const list = all.map(({ id, url, title, text }) => ({ id, url, title, preview: (text || '').slice(0, 300) }));
	res.json({ items: list });
});

router.get('/docs/:id', requireAdmin, (req, res) => {
	const item = getSourceById(req.params.id);
	if (!item) return res.status(404).json({ error: 'not found' });
	res.json(item);
});

router.put('/docs/:id', requireAdmin, (req, res) => {
	const { title, url, text } = req.body || {};
	const ok = updateSourceById(req.params.id, { title, url, text });
	if (!ok) return res.status(404).json({ error: 'not found' });
	res.json({ ok: true });
});

router.post('/rebuild', requireAdmin, (req, res) => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const script = path.resolve(__dirname, '..', 'scripts', 'build_kb.js');
	const child = spawn('node', [script], { stdio: 'inherit', env: process.env });
	child.on('exit', (code) => {
		console.log('KB rebuild finished with code', code);
	});
	res.json({ started: true });
});

export default router;