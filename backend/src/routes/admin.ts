import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// --- HELPERS ---
const DEFAULT_EXAM_ID = 'exam_cert_01'; // Matches the ID used in your app

// Ensure the default exam exists
const ensureExamExists = async () => {
  let exam = await prisma.exam.findUnique({ where: { id: DEFAULT_EXAM_ID } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        id: DEFAULT_EXAM_ID,
        title: "Community Responder Certification",
        questions: "[]", // Initialize as empty JSON string
        passing_score: 80
      }
    });
  }
  return exam;
};

// --- USER MANAGEMENT ---

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { is_responder: false, is_admin: false },
      select: { id: true, name: true, email: true, phone_number: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/responders
router.get('/responders', async (req: Request, res: Response) => {
  try {
    const responders = await prisma.user.findMany({
      where: { is_responder: true },
      select: { 
        id: true, name: true, email: true, phone_number: true, 
        is_certified: true, exam_passed: true, created_at: true 
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ responders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
});

// POST /api/admin/approve-responder/:id
router.post('/approve-responder/:id', async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { is_certified: true, is_available: true }
    });
    res.json({ message: 'Responder approved' });
  } catch (error) {
    res.status(500).json({ error: 'Approval failed' });
  }
});

// --- EXAM MANAGEMENT ---

// GET /api/admin/exam-questions
router.get('/exam-questions', async (req: Request, res: Response) => {
  try {
    const exam = await ensureExamExists();
    const questions = JSON.parse(exam.questions); // Parse string to JSON
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /api/admin/exam-questions
router.post('/exam-questions', async (req: Request, res: Response) => {
  try {
    const { question, option } = req.body; // option is the correct answer/note
    const exam = await ensureExamExists();
    
    const currentQuestions = JSON.parse(exam.questions);
    
    // Add new question
    const newQ = {
      id: Date.now().toString(),
      question,
      options: [option, "Option B", "Option C", "Option D"], // Mock options for simplicity
      correctAnswer: 0, // Defaulting to first option being correct for this simple admin UI
      points: 10,
      note: option // Store the intended answer text here
    };

    currentQuestions.push(newQ);

    await prisma.exam.update({
      where: { id: DEFAULT_EXAM_ID },
      data: { questions: JSON.stringify(currentQuestions) }
    });

    res.json({ success: true, questions: currentQuestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// DELETE /api/admin/exam-questions/:questionId
router.delete('/exam-questions/:questionId', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const exam = await ensureExamExists();
    
    let currentQuestions = JSON.parse(exam.questions);
    
    // Filter out the deleted question
    currentQuestions = currentQuestions.filter((q: any) => q.id !== questionId);

    await prisma.exam.update({
      where: { id: DEFAULT_EXAM_ID },
      data: { questions: JSON.stringify(currentQuestions) }
    });

    res.json({ success: true, questions: currentQuestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;