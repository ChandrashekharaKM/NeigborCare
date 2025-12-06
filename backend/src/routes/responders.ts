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

    // Update User Status in Database
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        is_available: is_available,
        // Only update location if coordinates are provided
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
    
    // Check if user doesn't exist (P2025 is Prisma's code for "Record to update not found")
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found. Please re-login.' });
    }

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

    res.json({ success: true, latitude, longitude });
  } catch (error) {
    console.error("Location Update Error:", error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

export default router;