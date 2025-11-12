import { Router } from 'express';

const router = Router();

// POST /api/responders/{userId}
router.post('/:userId', async (req: any, res: any) => {
  try {
    res.json({ message: 'Became responder' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// PUT /api/responders/{userId}/availability
router.put('/:userId/availability', async (req: any, res: any) => {
  try {
    const { is_available, latitude, longitude } = req.body;
    res.json({ is_available, latitude, longitude });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// PUT /api/responders/{userId}/location
router.put('/:userId/location', async (req: any, res: any) => {
  try {
    const { latitude, longitude } = req.body;
    res.json({ latitude, longitude });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/responders/{userId}/basic-training
router.post('/:userId/basic-training', async (req: any, res: any) => {
  try {
    res.json({ is_certified: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
