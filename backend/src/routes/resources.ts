import { Router } from 'express';

const router = Router();

// GET /api/resources/nearby
router.get('/nearby', async (req: any, res: any) => {
  try {
    const { latitude, longitude, radius } = req.query;
    res.json({
      resources: [
        {
          id: 'res1',
          name: 'Central Hospital',
          type: 'hospital',
          latitude,
          longitude,
          phone: '911',
          is_24_hours: true,
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
