import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { users } from '../data/store'; // <--- IMPORT SHARED STORE

dotenv.config();

const router = Router();
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

// --- ADMIN CREDENTIALS ---
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@neighborcare.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// POST /api/auth/request-otp
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; 

    otpStore.set(phone_number, { otp, expiresAt });
    console.log(`OTP for ${phone_number}: ${otp}`); 

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone_number, password, is_responder } = req.body;

    if (!name || !email || !phone_number || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 1. Check if trying to register as Admin
    if (email === ADMIN_EMAIL) {
       return res.status(400).json({ error: 'This email is reserved.' });
    }

    // 2. Check for duplicates in SHARED STORE
    // We normalize email to lowercase
    const existingUser = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() || 
      u.phone_number === phone_number
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User with this Email or Phone already exists.' });
    }

    // 3. Create User
    const newUser = {
      id: 'user_' + Date.now(),
      name,
      email: email.toLowerCase(),
      phone_number,
      password, // In a real app, hash this!
      is_responder: is_responder || false,
      is_admin: false,
      is_certified: false, // Responders start uncertified
      exam_passed: false,
      created_at: new Date().toISOString()
    };

    // 4. Save to SHARED STORE
    users.push(newUser);
    console.log(`✅ Registered: ${newUser.email} (${newUser.is_responder ? 'Responder' : 'User'})`);

    res.status(201).json({
      ...newUser,
      token: 'jwt_token_user_created',
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login (OTP Stub)
router.post('/login', async (req: Request, res: Response) => {
    // Keep your existing OTP logic here
    res.status(200).json({ 
      id: 'otp_user', 
      name: 'Mobile User',
      phone_number: req.body.phone_number,
      is_responder: false,
      token: 'otp_token' 
    });
});

// POST /api/auth/login-password
router.post('/login-password', async (req: Request, res: Response) => {
  try {
    const { phone_number: loginInput, password } = req.body;

    if (!loginInput || !password) {
      return res.status(400).json({ error: 'Credentials required' });
    }

    console.log(`🔐 Login Attempt: ${loginInput}`);

    // 1. ADMIN CHECK
    if (loginInput === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('✅ Admin Logged In');
      return res.status(200).json({
        id: 'admin_001',
        name: 'ADMIN',
        email: ADMIN_EMAIL,
        is_responder: false,
        is_admin: true,
        token: 'jwt_token_admin',
      });
    }

    // 2. REGULAR USER CHECK (From Shared Store)
    const foundUser = users.find(u => 
      (u.email === loginInput.toLowerCase() || u.phone_number === loginInput) && 
      u.password === password
    );

    if (foundUser) {
      console.log(`✅ User Logged In: ${foundUser.name}`);
      return res.status(200).json({
        ...foundUser,
        token: 'jwt_token_verified',
      });
    }

    console.log('❌ Login Failed: Invalid credentials');
    return res.status(401).json({ error: 'Invalid credentials' });

  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
});

export default router;