import { Router, Request, Response } from 'express';
import {
    getAllIncident,
    createIncident,
    getIncidentById,
    patchIncident,
    TimelinePost,
} from '../services/incidentService';

const router = Router();

router.get('/incidents', async (_req: Request, res: Response) => {
    try {
        const incidents = await getAllIncident();
        res.json(incidents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

router.post('/incidents', async (req: Request, res: Response) => {
    const { service_id, title, description } = req.body;
    if (!service_id || !title) {
        res.status(400).json({ error: 'Service ID and title are required' });
        return;
    }
    try {
        const incident = await createIncident(service_id, title, description);
        res.status(201).json(incident);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create incident' });
    }
});

router.get('/incidents/:id', async (req: Request, res: Response) => {
    try {
        const incident = await getIncidentById(String(req.params.id));
        if (!incident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }
        res.json(incident);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch incident' });
    }
});

router.patch('/incidents/:id/resolve', async (req: Request, res: Response) => {
    const { description } = req.body;
    try {
        const incident = await patchIncident(
            String(req.params.id),
            null,
            description ?? null,
            'resolved',
            new Date()
        );
        if (!incident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }
        res.json(incident);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update incident' });
    }
});

router.post('/incidents/:id/updates', async (req: Request, res: Response) => {
    const { description, status } = req.body;
    const validStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
    if (status && !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
    }
    if (!description || !status) {
        res.status(400).json({ error: 'description and status are required' });
        return;
    }
    try {
        const result = await TimelinePost(String(req.params.id), description, status);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to post timeline update' });
    }
});

export default router;
