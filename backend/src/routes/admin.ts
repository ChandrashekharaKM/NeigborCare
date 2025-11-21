import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    // TODO: Check if user is admin
    // TODO: Fetch all users from database
    
    // Mock data for now
    res.json({
      users: [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          is_responder: false,
          is_admin: false,
          created_at: new Date(),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/responders
router.get('/responders', async (req: Request, res: Response) => {
  try {
    // TODO: Check if user is admin
    // TODO: Fetch all responders from database
    
    // Mock data for now
    res.json({
      responders: [
        {
          id: 'responder1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone_number: '+1234567891',
          is_responder: true,
          is_certified: false,
          exam_passed: false,
          created_at: new Date(),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
});

// POST /api/admin/responders/:userId/approve
router.post('/responders/:userId/approve', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // TODO: Check if user is admin
    // TODO: Update responder status in database
    // TODO: Set is_certified = true, exam_passed = true
    
    res.json({
      message: 'Responder approved successfully',
      userId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve responder' });
  }
});

export default router;

