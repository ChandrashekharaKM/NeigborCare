import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/admin/users
// Fetch all regular users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        is_responder: false,
        is_admin: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Frontend expects { users: [...] }
    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/responders
// Fetch all responders
router.get('/responders', async (req: Request, res: Response) => {
  try {
    const responders = await prisma.user.findMany({
      where: {
        is_responder: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        is_certified: true,
        exam_passed: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Frontend expects { responders: [...] }
    res.json({ responders });
  } catch (error) {
    console.error("Error fetching responders:", error);
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
});

// POST /api/admin/approve-responder/:id
// Manually approve a responder
router.post('/approve-responder/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.user.update({
      where: { id },
      data: {
        is_certified: true,
        is_available: true
      }
    });

    res.json({ message: 'Responder approved successfully' });
  } catch (error) {
    console.error("Error approving responder:", error);
    res.status(500).json({ error: 'Failed to approve responder' });
  }
});

export default router;