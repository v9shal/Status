import { Router, Request, Response } from 'express';
import {
    getAllServices,
    createService,
    getServiceById,
    updateService,
} from '../services/serviceService';

const router = Router();

router.get('/services', async (_req: Request, res: Response) => {
    try {
        const services = await getAllServices();
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

router.post('/services', async (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    try {
        const service = await createService(name, description);
        res.status(201).json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

router.get('/services/:id', async (req: Request, res: Response) => {
    try {
        const service = await getServiceById(String(req.params.id));
        if (!service) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

router.patch('/services/:id', async (req: Request, res: Response) => {
    const { name, description, status } = req.body;
    const validStatuses = ['operational', 'degraded', 'partial_outage', 'major_outage'];
    if (status && !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
    }
    try {
        const service = await updateService(String(req.params.id), name, description, status);
        if (!service) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

export default router;
