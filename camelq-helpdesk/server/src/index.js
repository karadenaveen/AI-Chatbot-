import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from '../routes/chat.js';
import adminRouter from '../routes/admin.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
	.split(',')
	.map((s) => s.trim());

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			return callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	})
);

app.use(helmet());
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 60 });
app.use('/api/', limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/widget', express.static(path.join(__dirname, '..', 'public', 'widget')));
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));

app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => {
	console.log(`CamelQ Helpdesk running on port ${port}`);
});