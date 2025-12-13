import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/:id
// Fetches the real profile data including stats from the database
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        is_responder: true,
        is_available: true,
        is_certified: true,
        exam_passed: true,
        
        // ✅ These are the critical stats we are tracking
        successful_responses: true,
        emergency_alerts_received: true,
        total_lives_helped: true,
        
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/:id
// Updates profile info (e.g., becoming a responder, passing exam)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, is_responder, is_available, exam_passed, is_certified } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { 
        name, 
        email, 
        is_responder, 
        is_available,
        exam_passed,
        is_certified
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/:id/emergencies
// Optional: If you want to show a history list later
router.get('/:id/emergencies', async (req: Request, res: Response) => {
  try {
    const emergencies = await prisma.emergency.findMany({
      where: { user_id: req.params.id },
      orderBy: { created_at: 'desc' }
    });
    res.json({ emergencies });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;