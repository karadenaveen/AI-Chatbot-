import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateAssistantReply } from '../services/ai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const stableSessionId = sessionId || uuidv4();
    const reply = await generateAssistantReply({
      sessionId: stableSessionId,
      message,
      history: Array.isArray(history) ? history : [],
    });

    return res.json({ reply, sessionId: stableSessionId });
  } catch (error) {
    console.error('Chat route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;