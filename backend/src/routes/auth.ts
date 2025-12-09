import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // Use Prisma
import bcrypt from 'bcryptjs'; // Use Bcrypt for security
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// --- ADMIN CREDENTIALS (Hardcoded for safety) ---
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@neighborcare.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';


// POST /api/auth/change-password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    // 1. Find user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect old password' });

    // 3. Hash new password & update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone_number, password, is_responder } = req.body;

    if (!name || !email || !phone_number || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 1. Check if user exists in DB
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone_number: phone_number }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this Email or Phone already exists.' });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User in DB
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone_number,
        password: hashedPassword, // Store secure hash
        is_responder: is_responder || false,
        is_admin: false,
      }
    });

    console.log(`✅ DB Registered: ${newUser.email}`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      ...userWithoutPassword,
      token: 'jwt_token_placeholder', // Replace with real JWT later if needed
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login-password
router.post('/login-password', async (req: Request, res: Response) => {
  try {
    const { phone_number: loginInput, password } = req.body;

    if (!loginInput || !password) {
      return res.status(400).json({ error: 'Credentials required' });
    }

    console.log(`🔐 Login Attempt: ${loginInput}`);

    // 1. ADMIN CHECK (Hardcoded bypass)
    if (loginInput === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.status(200).json({
        id: 'admin_001',
        name: 'ADMIN',
        email: ADMIN_EMAIL,
        is_responder: false,
        is_admin: true,
        token: 'admin_token',
      });
    }

    // 2. DATABASE CHECK
    // Allow login by either Email OR Phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginInput.toLowerCase() },
          { phone_number: loginInput }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    console.log(`✅ DB Login Success: ${user.name}`);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      ...userWithoutPassword,
      token: 'user_token_placeholder',
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;