const express = require('express');
const router = express.Router();
const Question = require('../models/question.model');
const QuizAttempt = require('../models/quizAttempt.model');
const User = require('../models/user.model');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Apply both auth and admin middleware
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all users with their quiz statistics
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password');
    const userStats = await Promise.all(
      users.map(async (user) => {
        const attempts = await QuizAttempt.find({ user: user._id });
        const totalAttempts = attempts.length;
        const averageScore = totalAttempts > 0
          ? attempts.reduce((acc, curr) => acc + curr.totalScore, 0) / totalAttempts
          : 0;
        
        return {
          ...user.toObject(),
          totalAttempts,
          averageScore,
          lastAttempt: attempts[0]?.createdAt
        };
      })
    );
    res.json(userStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

// Get detailed analytics for a specific user
router.get('/users/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    const attempts = await QuizAttempt.find({ user: userId })
      .populate('questions.question', 'questionText category')
      .sort('-createdAt');

    const categoryWiseStats = {};
    attempts.forEach(attempt => {
      if (!categoryWiseStats[attempt.category]) {
        categoryWiseStats[attempt.category] = {
          totalAttempts: 0,
          totalScore: 0,
          averageScore: 0,
          totalQuestions: 0,
          correctAnswers: 0
        };
      }
      
      const stats = categoryWiseStats[attempt.category];
      stats.totalAttempts++;
      stats.totalScore += attempt.totalScore;
      stats.totalQuestions += attempt.totalQuestions;
      stats.correctAnswers += attempt.questions.filter(q => q.isCorrect).length;
      stats.averageScore = stats.totalScore / stats.totalAttempts;
    });

    res.json({
      user,
      totalAttempts: attempts.length,
      recentAttempts: attempts.slice(0, 5),
      categoryWiseStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user analytics', error: error.message });
  }
});

// Get all questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// Create new question
router.post('/questions', async (req, res) => {
  try {
    const { questionText, options, correctAnswer, category, difficulty, explanation } = req.body;
    
    const question = new Question({
      questionText,
      options,
      correctAnswer,
      category,
      difficulty,
      explanation
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// Update question
router.put('/questions/:id', async (req, res) => {
  try {
    const { questionText, options, correctAnswer, category, difficulty, explanation } = req.body;
    
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        questionText,
        options,
        correctAnswer,
        category,
        difficulty,
        explanation
      },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// Delete question
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

module.exports = router; 