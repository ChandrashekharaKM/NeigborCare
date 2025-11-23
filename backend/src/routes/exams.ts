import { Router, Request, Response } from 'express';
import { users } from '../data/store'; // <--- IMPORT SHARED STORE

const router = Router();

// GET /api/exams/:examId
router.get('/:examId', async (req: Request, res: Response) => {
  // (Keep existing question logic, or use the mock data from previous steps)
  try {
      res.json({
        exam: {
          id: req.params.examId,
          title: 'Responder Exam',
          questions: [], // Populate if needed
          passingScore: 80,
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
    const { userId, score, passed } = req.body;

    // Find user in shared store
    const user = users.find(u => u.id === userId);
    
    if (user) {
        if (passed) {
            user.exam_passed = true;
            user.is_certified = true; // Auto-certify on pass
            console.log(`User ${user.name} PASSED exam.`);
        }
    }

    res.json({
      message: 'Exam submitted',
      result: { userId, score, passed },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

export default router;