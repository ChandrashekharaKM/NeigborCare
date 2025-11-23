import { Router, Request, Response } from 'express';
import { users, deleteUserById } from '../data/store'; // <--- IMPORT SHARED STORE

const router = Router();

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    console.log('Admin fetching users. Total in DB:', users.length);
    // Filter for Regular Users
    const regularUsers = users.filter(u => !u.is_responder && !u.is_admin);
    res.json({ users: regularUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/responders
router.get('/responders', async (req: Request, res: Response) => {
  try {
    // Filter for Responders
    const responders = users.filter(u => u.is_responder);
    res.json({ responders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
});

// POST /api/admin/responders/:userId/approve
router.post('/responders/:userId/approve', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = users.find(u => u.id === userId);
    
    if (user) {
        user.is_certified = true;
        user.exam_passed = true;
        res.json({ message: 'Approved', userId });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const deleted = deleteUserById(userId);
    
    if (deleted) {
        res.json({ message: 'Deleted successfully', userId });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;