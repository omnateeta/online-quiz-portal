import express from 'express';
import quizController from '../controllers/quiz.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Get available quiz categories
router.get('/categories', quizController.getCategories);

// Get user's performance analytics
router.get('/analytics/:userId', quizController.getAnalytics);

// Get user's quiz history
router.get('/history/:userId', quizController.getQuizHistory);

// Get questions by category
router.get('/:category', quizController.getQuestionsByCategory);

// Submit quiz answers
router.post('/submit', quizController.submitQuiz);

export default router; 