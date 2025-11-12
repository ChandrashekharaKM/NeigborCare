import { Router } from 'express';

const router = Router();

// POST /api/emergency/create
router.post('/create', async (req: any, res: any) => {
  try {
    const { user_id, latitude, longitude, emergency_type } = req.body;
    res.status(201).json({
      emergency: {
        id: 'emergency123',
        user_id,
        latitude,
        longitude,
        emergency_type,
        status: 'pending',
        created_at: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/emergency/{id}
router.get('/:id', async (req: any, res: any) => {
  try {
    res.json({
      emergency: {
        id: req.params.id,
        status: 'pending',
      },
      responder: null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/emergency/{id}/alerts
router.get('/:id/alerts', async (req: any, res: any) => {
  try {
    res.json({ alerts: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/emergency/{id}/accept
router.post('/:id/accept', async (req: any, res: any) => {
  try {
    res.json({ status: 'in-progress' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/emergency/{id}/decline
router.post('/:id/decline', async (req: any, res: any) => {
  try {
    res.json({ declined: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/emergency/{id}/resolve
router.post('/:id/resolve', async (req: any, res: any) => {
  try {
    res.json({ status: 'resolved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
