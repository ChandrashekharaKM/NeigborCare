import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/exams/submit
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { userId, examId, score, totalQuestions, correctAnswers, answers, passed, location } = req.body;

    console.log(`📝 Exam Submission for ${userId}: ${passed ? 'PASSED' : 'FAILED'}`);

    // --- 1. DEVELOPER BYPASS LOGIC ---
    if (examId === 'dev_bypass') {
      console.log('🔓 EXECUTING DEVELOPER BYPASS');

      try {
        // Attempt to update the user in the database
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            is_responder: true,
            exam_passed: true,
            is_certified: true,
            is_available: true,
            exam_score: 100,
            exam_completed_at: new Date(),
          },
        });

        console.log(`✅ User ${updatedUser.name} is now a Responder (Bypass Success)`);
        return res.status(200).json({ message: 'Bypass Successful', user: updatedUser });

      } catch (error: any) {
        console.error("❌ Bypass Error:", error.code);
        
        // P2025 means "Record to update not found."
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'User ID not found in Database. Please Sign Out and Register again.' });
        }
        
        return res.status(500).json({ error: 'Database update failed.' });
      }
    }

    // --- 2. STANDARD EXAM LOGIC ---
    
    // Ensure exam exists
    let exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          id: examId,
          title: "Community Responder Certification",
          questions: "[]",
          passing_score: 80,
        }
      });
    }

    // Create Result
    await prisma.examResult.create({
      data: {
        user_id: userId,
        exam_id: examId,
        score: score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        answers: JSON.stringify(answers),
        passed: passed,
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null,
        started_at: new Date(),
        submitted_at: new Date(),
      }
    });

    // Update User Profile
    if (passed) {
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
    }

    res.status(200).json({ success: true, message: passed ? 'Exam Passed' : 'Exam Failed' });

  } catch (error) {
    console.error("❌ Exam Submit Error:", error);
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
          passingScore: 80,
          duration: 30,
        },
      });
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

export default router;