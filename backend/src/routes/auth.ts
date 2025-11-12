import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone_number, name, is_responder } = req.body;

    // TODO: Validate input
    // TODO: Hash password if needed
    // TODO: Create user in database
    // TODO: Generate JWT token

    res.status(201).json({
      id: 'user123',
      phone_number,
      name,
      is_responder,
      token: 'jwt_token_here',
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;

    // TODO: Find user by phone
    // TODO: Verify credentials
    // TODO: Generate JWT token

    res.status(200).json({
      id: 'user123',
      phone_number,
      name: 'User Name',
      token: 'jwt_token_here',
    });
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
});

export default router;
