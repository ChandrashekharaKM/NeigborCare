import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/exams/:examId
router.get('/:examId', async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    
    // TODO: Fetch exam from database
    
    // Mock exam data
    res.json({
      exam: {
        id: examId,
        title: 'Responder Certification Exam',
        description: 'Complete this exam to become a certified responder',
        questions: [],
        passingScore: 70,
        duration: 30,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// POST /api/exams/submit
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      examId,
      score,
      totalQuestions,
      correctAnswers,
      answers,
      passed,
      location,
    } = req.body;

    // TODO: Save exam result to database
    // TODO: If passed, update user's exam_passed = true, exam_score = score
    // TODO: Save location if provided

    res.json({
      message: 'Exam submitted successfully',
      result: {
        id: 'result1',
        userId,
        examId,
        score,
        totalQuestions,
        correctAnswers,
        passed,
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

export default router;

