const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes - require authentication
router.use(authMiddleware);

// Get available quiz categories
router.get('/categories', quizController.getCategories);

// Get questions by category
router.get('/:category', quizController.getQuestionsByCategory);

// Submit quiz answers
router.post('/submit', quizController.submitQuiz);

// Get user's quiz history
router.get('/history/:userId', quizController.getQuizHistory);

// Get user's performance analytics
router.get('/analytics/:userId', quizController.getAnalytics);

module.exports = router; 