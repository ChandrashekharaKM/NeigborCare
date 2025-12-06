import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// PUT /api/responders/:userId/availability
router.put('/:userId/availability', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { is_available, latitude, longitude } = req.body;

    console.log(`📡 Status Update for ${userId}: ${is_available ? 'ONLINE' : 'OFFLINE'}`);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        is_available: is_available,
        ...(latitude && longitude ? { latitude, longitude } : {})
      }
    });

    res.json({ 
      success: true, 
      is_available: user.is_available,
      latitude: user.latitude,
      longitude: user.longitude
    });

  } catch (error: any) {
    console.error("Availability Update Error:", error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found.' });
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// PUT /api/responders/:userId/location
router.put('/:userId/location', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// ✅ NEW: Polling Endpoint for Alerts
// GET /api/responders/:userId/alerts
router.get('/:userId/alerts', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Find the latest PENDING alert for this responder
    const alert = await prisma.emergencyAlert.findFirst({
      where: {
        responder_id: userId,
        status: 'pending'
      },
      include: {
        emergency: {
          include: { user: true } // Get victim name/details
        }
      },
      orderBy: { sent_at: 'desc' }
    });

    if (!alert) {
      return res.json({ hasAlert: false });
    }

    // Found one!
    res.json({
      hasAlert: true,
      alertId: alert.id,
      emergency: alert.emergency,
      distance: alert.distance
    });

  } catch (error) {
    console.error("Alert Check Error:", error);
    res.status(500).json({ error: 'Failed to check alerts' });
  }
});

export default router;