import { Router, Request, Response } from 'express';
import { getStatus, getHistory } from '../services/publicService';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
    try {
        const payload = await getStatus();
        res.status(200).json(payload);
    } catch (err) {
        console.error('Error fetching status:', err);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

router.get('/history', async (_req: Request, res: Response) => {
    try {
        const payload = await getHistory();
        res.status(200).json(payload);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
