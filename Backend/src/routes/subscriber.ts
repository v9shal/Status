import { Router, Request, Response } from 'express';
import {
    createSubscriber,
    confirmSubscriber,
    deleteSubscriber,
} from '../services/subscriberService';

const router = Router();

router.post('/subscriber', async (req: Request, res: Response) => {
    const { email, service_id } = req.body;
    if (!email || !service_id) {
        res.status(400).json({ error: 'Email and service ID are required' });
        return;
    }
    try {
        const subscriber = await createSubscriber(email, service_id);
        res.status(201).json(subscriber);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create subscriber' });
    }
});

router.get('/subscriber/confirm', async (req: Request, res: Response) => {
    const token = req.query.token;
    if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Token is required' });
        return;
    }
    try {
        const result = await confirmSubscriber(token);
        res.status(200).json(result);
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err?.message ?? 'Failed to confirm' });
    }
});

router.delete('/subscriber/unsubscribe', async (req: Request, res: Response) => {
    const { email, service_id } = req.body;
    if (!email || !service_id) {
        res.status(400).json({ error: 'Email and service ID are required' });
        return;
    }
    try {
        const result = await deleteSubscriber(email, service_id);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

export default router;
