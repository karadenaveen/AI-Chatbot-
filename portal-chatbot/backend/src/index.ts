import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './utils/config';
import healthRouter from './routes/health';
import schemaRouter from './routes/schema';
import chatRouter from './routes/chat';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/api/health', healthRouter);
app.use('/api/schema', schemaRouter);
app.use('/api', chatRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend running on port ${env.BACKEND_PORT}`);
});