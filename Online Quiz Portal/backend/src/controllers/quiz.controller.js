const Question = require('../models/question.model');
const QuizAttempt = require('../models/quizAttempt.model');

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

      const query = { category };
      if (difficulty) {
        query.difficulty = difficulty;
      }

      const questions = await Question.find(query)
        .select('-correctAnswer') // Don't send correct answer to client
        .limit(Number(limit));

      if (!questions.length) {
        return res.status(404).json({ message: 'No questions found for this category' });
      }

      res.json({ questions });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
  },

  // Submit quiz answers
  submitQuiz: async (req, res) => {
    try {
      const { category, answers, timeTaken, startTime, endTime } = req.body;
      const userId = req.user._id;

      // Validate answers format
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: 'Invalid answers format' });
      }

      // Get questions to check answers
      const questionIds = answers.map(a => a.questionId);
      const questions = await Question.find({ _id: { $in: questionIds } });

      // Calculate scores
      let totalCorrect = 0;
      const questionResults = answers.map(answer => {
        const question = questions.find(q => q._id.toString() === answer.questionId);
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) totalCorrect++;
        
        return {
          question: question._id,
          selectedAnswer: answer.selectedAnswer,
          isCorrect
        };
      });

      const totalQuestions = answers.length;
      const totalScore = (totalCorrect / totalQuestions) * 100;

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

      await quizAttempt.save();

      res.json({
        message: 'Quiz submitted successfully',
        result: {
          quizId: quizAttempt._id,
          totalQuestions,
          correctAnswers: totalCorrect,
          score: totalScore,
          timeTaken
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting quiz', error: error.message });
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
          totalAttempts: totalQuizzes, // For backward compatibility
          averageScore: overallAverageScore,
          totalCorrect: overallCorrect,
          totalQuestions: overallQuestions,
          improvement: calculateImprovement(quizAttempts)
        },
        categoryWise: categoryStats,
        recentActivity: quizAttempts.slice(0, 5).map(attempt => ({
          category: attempt.category,
          score: attempt.totalScore,
          date: attempt.endTime,
          questionsAnswered: attempt.questions.length,
          correctAnswers: attempt.questions.filter(q => q.isCorrect).length
        }))
      };

      console.log('Analytics response:', {
        userId,
        totalQuizzes,
        quizAttemptsLength: quizAttempts.length,
        overallStats: response.overall
      });

      res.json(response);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ 
        message: 'Error fetching analytics', 
        error: error.message 
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