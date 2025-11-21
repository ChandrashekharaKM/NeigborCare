import { Router, Request, Response } from 'express';

const router = Router();

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

// POST /api/auth/request-otp
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP (in production, send via SMS service like Twilio)
    otpStore.set(phone_number, { otp, expiresAt });

    console.log(`OTP for ${phone_number}: ${otp}`); // Remove in production

    res.status(200).json({
      message: 'OTP sent successfully',
      // In production, don't send OTP in response
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone_number, password, is_responder, is_admin } = req.body;

    // Validate input
    if (!name || !email || !phone_number || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // TODO: Validate email format
    // TODO: Validate phone number format
    // TODO: Hash password using bcrypt
    // TODO: Check if user already exists
    // TODO: Create user in database
    // TODO: Generate JWT token

    res.status(201).json({
      id: 'user123',
      name,
      email,
      phone_number,
      is_responder: is_responder || false,
      is_admin: is_admin || false,
      token: 'jwt_token_here',
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login (OTP login)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // Verify OTP
    const storedOtp = otpStore.get(phone_number);
    if (!storedOtp) {
      return res.status(401).json({ error: 'OTP not found or expired' });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(phone_number);
      return res.status(401).json({ error: 'OTP expired' });
    }

    if (storedOtp.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP verified, remove it
    otpStore.delete(phone_number);

    // TODO: Find user by phone
    // TODO: Generate JWT token

    res.status(200).json({
      id: 'user123',
      phone_number,
      name: 'User Name',
      email: 'user@example.com',
      is_responder: false,
      token: 'jwt_token_here',
    });
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
});

// POST /api/auth/login-password (Password login)
router.post('/login-password', async (req: Request, res: Response) => {
  try {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }

    // TODO: Find user by phone number
    // TODO: Verify password using bcrypt
    // TODO: Generate JWT token

    // For now, return mock response
    // In production, verify password hash from database
    res.status(200).json({
      id: 'user123',
      phone_number,
      name: 'User Name',
      email: 'user@example.com',
      is_responder: false,
      token: 'jwt_token_here',
    });
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
});

export default router;
