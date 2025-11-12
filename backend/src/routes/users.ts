import { Router } from 'express';

const router = Router();

// GET /api/users/{id}
router.get('/:id', async (req: any, res: any) => {
  try {
    res.json({
      id: req.params.id,
      name: 'User Name',
      phone_number: '+1234567890',
      is_responder: false,
      successful_responses: 0,
      emergency_alerts_received: 0,
      total_lives_helped: 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/users/{id}/emergencies
router.get('/:id/emergencies', async (req: any, res: any) => {
  try {
    res.json({
      emergencies: [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
