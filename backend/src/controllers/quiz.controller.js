const Question = require('../models/question.model');
const QuizAttempt = require('../models/quizAttempt.model');
const certificateController = require('./certificate.controller');
const mongoose = require('mongoose');

// Helper function to check attempt limits
const checkAttemptLimits = async (userId, category) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attemptCount = await QuizAttempt.countDocuments({
    user: userId,
    category: category,
    startTime: {
      $gte: today,
      $lt: tomorrow
    }
  });

  if (attemptCount >= 3) {
    const nextAttemptTime = new Date(tomorrow);
    const timeUntilNext = nextAttemptTime - new Date();
    const hoursUntilNext = Math.ceil(timeUntilNext / (1000 * 60 * 60));
    
    throw new Error(`You have reached the maximum limit of 3 attempts for today. Please try again after ${hoursUntilNext} hours at ${nextAttemptTime.toLocaleTimeString()}.`);
  }

  return attemptCount;
};

const quizController = {
  // Get all available categories
  getCategories: async (req, res) => {
    try {
      const categories = await Question.distinct('category');
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
  },

  // Get questions by category
  getQuestionsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const { limit = 10, difficulty } = req.query;
      const userId = req.user._id;

      // Check attempt limits
      try {
        const attemptCount = await checkAttemptLimits(userId, category);
        const attemptsLeft = 3 - attemptCount;

        const query = { category };
        if (difficulty) {
          query.difficulty = difficulty;
        }

        const questions = await Question.find(query)
          .select('-correctAnswer')
          .limit(Number(limit));

        if (!questions.length) {
          return res.status(404).json({ message: 'No questions found for this category' });
        }

        res.json({ 
          questions,
          attemptsLeft,
          nextAttemptTime: attemptCount >= 3 ? new Date(new Date().setHours(24, 0, 0, 0)) : null
        });
      } catch (error) {
        if (error.message.includes('Daily attempt limit reached')) {
          const nextAttemptTime = new Date(new Date().setHours(24, 0, 0, 0));
          return res.status(429).json({ 
            message: error.message,
            nextAttemptTime,
            attemptsLeft: 0
          });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
  },

  // Submit quiz answers
  submitQuiz: async (req, res) => {
    try {
      console.log('Quiz submission started:', {
        body: req.body,
        user: req.user._id
      });

      const { category, answers, timeTaken, startTime, endTime } = req.body;
      const userId = req.user._id;

      // Check attempt limits first
      try {
        await checkAttemptLimits(userId, category);
      } catch (limitError) {
        return res.status(429).json({ 
          message: limitError.message,
          nextAttemptTime: new Date(new Date().setHours(24, 0, 0, 0)),
          attemptsLeft: 0
        });
      }

      // Validate required fields
      if (!category || !answers || !timeTaken || !startTime || !endTime) {
        console.log('Missing required fields:', { category, answers, timeTaken, startTime, endTime });
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate answers format
      if (!Array.isArray(answers)) {
        console.log('Invalid answers format:', answers);
        return res.status(400).json({ message: 'Invalid answers format' });
      }

      // Validate question IDs
      const invalidIds = answers.filter(a => !mongoose.Types.ObjectId.isValid(a.questionId));
      if (invalidIds.length > 0) {
        console.log('Invalid question IDs:', invalidIds);
        return res.status(400).json({ message: 'Invalid question IDs found' });
      }

      // Get questions to check answers
      const questionIds = answers.map(a => a.questionId);
      console.log('Fetching questions for IDs:', questionIds);
      
      const questions = await Question.find({ _id: { $in: questionIds } });
      console.log('Found questions:', questions.length);

      if (questions.length !== answers.length) {
        console.log('Questions count mismatch:', {
          expected: answers.length,
          found: questions.length,
          questionIds,
          foundIds: questions.map(q => q._id.toString())
        });
        return res.status(400).json({ 
          message: 'Invalid question count',
          expected: answers.length,
          found: questions.length
        });
      }

      // Calculate scores
      let totalCorrect = 0;
      const questionResults = answers.map(answer => {
        const question = questions.find(q => q._id.toString() === answer.questionId);
        if (!question) {
          console.log('Question not found:', answer.questionId);
          throw new Error(`Question not found: ${answer.questionId}`);
        }
        
        // Validate answer value
        if (typeof answer.selectedAnswer !== 'number' || 
            answer.selectedAnswer < -1 || 
            answer.selectedAnswer >= question.options.length) {
          throw new Error(`Invalid answer value for question ${answer.questionId}`);
        }

        const isCorrect = answer.selectedAnswer !== -1 && question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) totalCorrect++;
        
        return {
          question: question._id,
          selectedAnswer: answer.selectedAnswer,
          isCorrect
        };
      });

      const totalQuestions = answers.length;
      const totalScore = (totalCorrect / totalQuestions) * 100;

      console.log('Score calculation:', {
        totalCorrect,
        totalQuestions,
        totalScore,
        userId,
        category
      });

      // Create quiz attempt record
      const quizAttempt = new QuizAttempt({
        user: userId,
        category,
        questions: questionResults,
        totalScore,
        totalQuestions,
        timeTaken,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        categoryScores: new Map([[category, {
          attempted: totalQuestions,
          correct: totalCorrect,
          percentage: totalScore
        }]])
      });

      console.log('Saving quiz attempt:', {
        id: quizAttempt._id,
        user: quizAttempt.user,
        category: quizAttempt.category,
        score: quizAttempt.totalScore
      });

      try {
        await quizAttempt.save();
        console.log('Quiz attempt saved successfully');
      } catch (saveError) {
        console.error('Error saving quiz attempt:', saveError);
        throw new Error('Failed to save quiz attempt: ' + saveError.message);
      }

      // Generate certificate if score is above 50%
      let certificate = null;
      if (totalScore >= 50) {
        try {
          console.log('Attempting to generate certificate for quiz:', quizAttempt._id);
          certificate = await certificateController.generateCertificate(quizAttempt._id);
          console.log('Certificate generated:', certificate);
        } catch (certError) {
          console.error('Certificate generation error:', certError);
          // Don't fail the quiz submission if certificate generation fails
        }
      } else {
        console.log('Score below 50%, skipping certificate generation');
      }

      const response = {
        message: 'Quiz submitted successfully',
        result: {
          quizId: quizAttempt._id,
          totalQuestions,
          correctAnswers: totalCorrect,
          score: totalScore,
          timeTaken,
          fromQuiz: true,
          category,
          certificate: certificate ? {
            id: certificate._id,
            certificateNumber: certificate.certificateNumber
          } : null
        }
      };

      console.log('Sending response:', response);
      res.json(response);
    } catch (error) {
      console.error('Quiz submission error:', {
        error: error.message,
        stack: error.stack,
        user: req.user?._id
      });
      res.status(500).json({ 
        message: 'Error submitting quiz', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get user's quiz history
  getQuizHistory: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const quizAttempts = await QuizAttempt.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('questions.question', 'questionText category');

      const total = await QuizAttempt.countDocuments({ user: userId });

      res.json({
        quizAttempts,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching quiz history', error: error.message });
    }
  },

  // Get user's performance analytics
  getAnalytics: async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          message: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }

      // Get all quiz attempts for the user with populated questions
      const quizAttempts = await QuizAttempt.find({ user: userId })
        .populate('questions.question')
        .sort({ createdAt: -1 })
        .lean();

      // Calculate overall statistics
      const totalQuizzes = await QuizAttempt.countDocuments({ user: userId });
      let overallCorrect = 0;
      let overallQuestions = 0;

      // Initialize category stats
      const categoryStats = {
        'Aptitude': {
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          averageScore: 0,
          correctAnswers: 0,
          bestScore: 0,
          recentScores: []
        },
        'Logical Reasoning': {
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          averageScore: 0,
          correctAnswers: 0,
          bestScore: 0,
          recentScores: []
        },
        'Technical': {
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          averageScore: 0,
          correctAnswers: 0,
          bestScore: 0,
          recentScores: []
        },
        'General Knowledge': {
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          averageScore: 0,
          correctAnswers: 0,
          bestScore: 0,
          recentScores: []
        }
      };

      // Calculate category-wise performance
      quizAttempts.forEach(attempt => {
        const category = attempt.category;
        if (categoryStats[category]) {
          const stats = categoryStats[category];
          stats.totalAttempts++;
          
          // Count correct answers for this attempt
          const correctAnswers = attempt.questions.filter(q => q.isCorrect).length;
          const attemptScore = (correctAnswers / attempt.questions.length) * 100;
          
          stats.totalCorrect += correctAnswers;
          stats.correctAnswers += correctAnswers;
          stats.totalQuestions += attempt.questions.length;
          stats.recentScores.push(attemptScore);
          stats.bestScore = Math.max(stats.bestScore, attemptScore);
          
          // Update overall statistics
          overallCorrect += correctAnswers;
          overallQuestions += attempt.questions.length;
        }
      });

      // Calculate final averages and format data
      Object.values(categoryStats).forEach(stats => {
        if (stats.totalQuestions > 0) {
          stats.averageScore = (stats.totalCorrect / stats.totalQuestions) * 100;
          stats.recentScores = stats.recentScores.slice(0, 5); // Keep only last 5 scores
        }
      });

      const overallAverageScore = overallQuestions > 0 
        ? (overallCorrect / overallQuestions) * 100 
        : 0;

      // Format final response
      const response = {
        overall: {
          totalQuizzes,
          totalAttempts: totalQuizzes,
          averageScore: overallAverageScore,
          totalCorrect: overallCorrect,
          totalQuestions: overallQuestions,
          improvement: calculateImprovement(quizAttempts)
        },
        categoryWise: categoryStats,
        recentActivity: quizAttempts.slice(0, 5).map(attempt => ({
          category: attempt.category,
          score: (attempt.questions.filter(q => q.isCorrect).length / attempt.questions.length) * 100,
          date: attempt.endTime || attempt.createdAt,
          questionsAnswered: attempt.questions.length,
          correctAnswers: attempt.questions.filter(q => q.isCorrect).length,
          _id: attempt._id
        }))
      };

      console.log('Analytics response:', {
        userId,
        totalQuizzes,
        quizAttemptsLength: quizAttempts.length,
        overallStats: response.overall,
        timestamp: new Date().toISOString()
      });

      res.json(response);
    } catch (error) {
      console.error('Analytics error:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({ 
        message: 'Error fetching analytics', 
        error: error.message,
        code: 'ANALYTICS_ERROR'
      });
    }
  }
};

// Helper function to calculate improvement
function calculateImprovement(attempts) {
  if (attempts.length < 2) return 0;
  
  const recentAttempts = attempts.slice(0, 5);
  const recentAvg = recentAttempts.reduce((acc, curr) => acc + curr.totalScore, 0) / recentAttempts.length;
  const olderAttempts = attempts.slice(5, 10);
  
  if (olderAttempts.length === 0) return 0;
  
  const olderAvg = olderAttempts.reduce((acc, curr) => acc + curr.totalScore, 0) / olderAttempts.length;
  return recentAvg - olderAvg;
}

module.exports = quizController; 