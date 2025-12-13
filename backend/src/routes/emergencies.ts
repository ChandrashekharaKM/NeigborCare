import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper: Haversine Formula (Meters)
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 1. CREATE EMERGENCY (Increments 'Alerts Received' for Responders)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { user_id, latitude, longitude, emergency_type, description } = req.body;

    console.log(`🚨 SOS received from User ${user_id}`);

    // Create Emergency Record
    const emergency = await prisma.emergency.create({
      data: {
        user_id,
        latitude,
        longitude,
        emergency_type,
        description: description || "Immediate assistance required",
        status: 'pending',
      }
    });

    // Find Nearby Responders
    const allResponders = await prisma.user.findMany({
      where: {
        is_responder: true,
        is_available: true,
        latitude: { not: null },
        longitude: { not: null }
      }
    });

    // Filter by Radius (2km)
    let selectedResponders = allResponders.filter(r => {
      const dist = getDistanceInMeters(latitude, longitude, r.latitude!, r.longitude!);
      return dist <= 2000;
    });

    console.log(`✅ Notifying ${selectedResponders.length} responders.`);

    if (selectedResponders.length > 0) {
      // A. Create Alert Records
      await Promise.all(
        selectedResponders.map(r => {
          const dist = Math.round(getDistanceInMeters(latitude, longitude, r.latitude!, r.longitude!));
          return prisma.emergencyAlert.create({
            data: {
              emergency_id: emergency.id,
              responder_id: r.id,
              distance: dist,
              status: 'pending'
            }
          });
        })
      );

      // B. ✅ INCREMENT 'ALERTS RECEIVED' STAT FOR THESE RESPONDERS
      // This ensures the "Alerts" count goes up in the database for everyone notified
      await Promise.all(
        selectedResponders.map(r => 
            prisma.user.update({
                where: { id: r.id },
                data: { emergency_alerts_received: { increment: 1 } }
            })
        )
      );
    }

    res.json({ 
      success: true, 
      message: 'Emergency Created', 
      emergency: emergency, 
      respondersNotified: selectedResponders.length 
    });

  } catch (error) {
    console.error("SOS Error:", error);
    res.status(500).json({ error: 'Failed to create emergency' });
  }
});

// GET EMERGENCY STATUS
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const emergency = await prisma.emergency.findUnique({
      where: { id: req.params.id },
      include: { responder: true, user: true }
    });
    
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });

    res.json({ emergency, responder: emergency.responder });
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// 2. ACCEPT MISSION (Increments 'Successful Responses')
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const { responder_id } = req.body;
    
    // Assign Responder
    await prisma.emergency.update({
      where: { id: req.params.id },
      data: { status: 'in-progress', responder_id: responder_id }
    });

    // Update Alert Statuses
    await prisma.emergencyAlert.updateMany({
      where: { emergency_id: req.params.id, responder_id: responder_id },
      data: { status: 'accepted', responded_at: new Date() }
    });

    // Close other alerts
    await prisma.emergencyAlert.updateMany({
      where: { emergency_id: req.params.id, responder_id: { not: responder_id } },
      data: { status: 'declined' } 
    });

    // ✅ INCREMENT 'SUCCESSFUL RESPONSES'
    await prisma.user.update({
        where: { id: responder_id },
        data: { successful_responses: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept" });
  }
});

// 3. RESOLVE MISSION (Increments 'Lives Helped')
router.post('/:id/resolve', async (req: Request, res: Response) => {
    try {
        const emergency = await prisma.emergency.update({
            where: { id: req.params.id },
            data: { status: 'resolved', resolved_at: new Date() }
        });

        // ✅ INCREMENT 'LIVES HELPED'
        if (emergency.responder_id) {
            await prisma.user.update({
                where: { id: emergency.responder_id },
                data: { total_lives_helped: { increment: 1 } }
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to resolve" });
    }
});

export default router;