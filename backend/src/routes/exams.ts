import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { users, findUserById } from '../data/store';

const router = Router();
const prisma = new PrismaClient();

// POST /api/exams/submit
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { userId, examId, score, totalQuestions, correctAnswers, answers, passed, location } = req.body;

    console.log(`📝 Exam Submission for ${userId}: Score ${score}% (${passed ? 'PASS' : 'FAIL'})`);

    // --- 1. DEVELOPER BYPASS LOGIC ---
    if (examId === 'dev_bypass') {
      console.log('🔓 EXECUTING DEVELOPER BYPASS');

      // Try to update via Prisma if DB is available, otherwise fall back to in-memory store
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            is_responder: true,
            exam_passed: true,
            is_certified: true,
            is_available: true,
            exam_score: 100,
            exam_completed_at: new Date(),
          }
        });

        return res.status(200).json({ message: 'Bypass Successful. You are now a Responder.' });
      } catch (dbErr) {
        console.warn('Prisma update failed, falling back to in-memory store for bypass:', String(dbErr));

        const user = findUserById(userId);
        if (user) {
          user.is_responder = true;
          user.exam_passed = true;
          user.is_certified = true;
          user.is_available = true;
          user.exam_score = 100;
          user.exam_completed_at = new Date().toISOString();

          console.log(`Bypass applied to in-memory user: ${userId}`);
          return res.status(200).json({ message: 'Bypass Successful (in-memory). You are now a Responder.' });
        }

        // If user not found even in memory, still return success but warn
        console.warn('User not found in in-memory store for bypass:', userId);
        return res.status(200).json({ message: 'Bypass applied, but user record not found locally.' });
      }
    }

    // --- 2. NORMAL EXAM LOGIC ---
    
    // --- Ensure exam exists in DB if possible ---
    let exam = null;
    try {
      exam = await prisma.exam.findUnique({ where: { id: examId } });

      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            id: examId,
            title: "Community Responder Certification",
            questions: JSON.stringify([]),
            passing_score: 80,
          }
        });
      }
    } catch (e) {
      console.warn('Prisma unavailable or exam create/find failed, continuing without DB:', String(e));
      exam = null;
    }

    // Create the result record (attempt DB write, but don't fail if DB is unavailable)
    try {
      await prisma.examResult.create({
        data: {
          user_id: userId,
          exam_id: examId,
          score: score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          answers: answers, // Prisma `Json` accepts JS object/array
          passed: passed,
          location_lat: location?.latitude || null,
          location_lng: location?.longitude || null,
          started_at: new Date(),
          submitted_at: new Date(),
        }
      });
    } catch (e) {
      console.warn('Failed to persist exam result to DB, continuing in-memory only:', String(e));
    }

    // Update User Profile if they passed (try DB, fall back to in-memory)
    if (passed) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            is_responder: true,
            exam_passed: true,
            is_certified: true,
            is_available: true,
            exam_score: score,
            exam_completed_at: new Date(),
          }
        });
      } catch (e) {
        console.warn('Prisma user update failed, updating in-memory user instead:', String(e));
        const user = findUserById(userId);
        if (user) {
          user.is_responder = true;
          user.exam_passed = true;
          user.is_certified = true;
          user.is_available = true;
          user.exam_score = score;
          user.exam_completed_at = new Date().toISOString();
        } else {
          console.warn('User not found in in-memory store during exam pass update:', userId);
        }
      }
    }

    res.status(200).json({ success: true, message: passed ? 'Exam Passed' : 'Exam Failed' });

  } catch (error) {
    console.error("Exam Submit Error:", error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// GET /api/exams/:examId
router.get('/:examId', async (req: Request, res: Response) => {
  try {
      res.json({
        exam: {
          id: req.params.examId,
          title: 'Responder Exam',
          questions: [], 
          passingScore: 80, // Frontend expects camelCase here, this is just JSON response
          duration: 30,
        },
      });
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

export default router;