import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// Shuffle array function using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Quiz = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const questionContainerRef = useRef(null);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Store original question order and option mappings
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [optionMappings, setOptionMappings] = useState([]);
  // New state for attempt limits
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [nextAttemptTime, setNextAttemptTime] = useState(null);
  const [isAttemptLimitReached, setIsAttemptLimitReached] = useState(false);

  // Scroll to questions when they're loaded
  useEffect(() => {
    if (!loading && questions.length > 0 && questionContainerRef.current) {
      questionContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, questions]);

  // Check attempt limits on component mount and after submission
  const checkAttemptLimits = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/quizzes/${category}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAttemptsLeft(response.data.attemptsLeft);
      setNextAttemptTime(response.data.nextAttemptTime);
      setIsAttemptLimitReached(response.data.attemptsLeft === 0);

      if (response.data.attemptsLeft === 0) {
        navigate('/dashboard');
        toast.error('You have reached the maximum attempts for today. Please try again tomorrow.');
        return false;
      }
      return true;
    } catch (err) {
      if (err.response?.status === 429) {
        setIsAttemptLimitReached(true);
        setAttemptsLeft(0);
        setNextAttemptTime(err.response.data.nextAttemptTime);
        navigate('/dashboard');
        toast.error(err.response.data.message);
        return false;
      }
      console.error('Error checking attempt limits:', err);
      return false;
    }
  }, [category, navigate]);

  // Check limits on component mount
  useEffect(() => {
    checkAttemptLimits();
  }, [checkAttemptLimits]);

  // Authentication and questions fetch
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        if (!isAuthenticated || !user) {
          const returnTo = `/quiz/${category}`;
          navigate('/login', { 
            state: { from: returnTo },
            replace: true
          });
          return;
        }

        // Check attempt limits before fetching questions
        const canAttempt = await checkAttemptLimits();
        if (!canAttempt) {
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch questions
        const response = await axios.get(
          `http://localhost:5000/api/quizzes/${category}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!response.data || !response.data.questions || response.data.questions.length === 0) {
          throw new Error('No questions available for this category');
        }

        // Store original questions
        setOriginalQuestions(response.data.questions);

        // Shuffle questions
        const shuffledQuestions = shuffleArray(response.data.questions);

        // Create shuffled options for each question and store mappings
        const questionsWithShuffledOptions = shuffledQuestions.map(question => {
          const originalOptions = [...question.options];
          const shuffledOptions = shuffleArray(originalOptions);
          
          // Create mapping from shuffled index to original index
          const mapping = shuffledOptions.map(option => originalOptions.indexOf(option));
          
          return {
            ...question,
            options: shuffledOptions,
            optionMapping: mapping
          };
        });

        // Store option mappings for submission
        setOptionMappings(questionsWithShuffledOptions.map(q => q.optionMapping));

        // Remove mappings from questions before setting state
        const finalQuestions = questionsWithShuffledOptions.map(({ optionMapping, ...q }) => q);
        
        setQuestions(finalQuestions);
        setAnswers(new Array(finalQuestions.length).fill(null));
        setError(null);
      } catch (err) {
        console.error('Failed to initialize quiz:', err);
        let errorMessage = err.response?.data?.message || err.message || 'Failed to load quiz';
        
        if (err.response?.status === 429) {
          setIsAttemptLimitReached(true);
          setAttemptsLeft(0);
          setNextAttemptTime(err.response.data.nextAttemptTime);
          navigate('/dashboard');
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [category, isAuthenticated, user, navigate, checkAttemptLimits]);

  // Handle quiz submission
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !user?.id) return;

    try {
      setIsSubmitting(true);
      
      // Check attempt limits before submitting
      const canAttempt = await checkAttemptLimits();
      if (!canAttempt) {
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to submit the quiz');
        navigate('/login', { state: { from: `/quiz/${category}` } });
        return;
      }

      const endTime = new Date();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

      // Map shuffled answers back to original question and option order
      const originalAnswers = answers.map((answer, questionIndex) => {
        if (answer === null) return -1;
        return optionMappings[questionIndex][answer];
      });

      const submission = {
        userId: user.id,
        category,
        answers: originalQuestions.map((q, index) => ({
          questionId: q._id,
          selectedAnswer: originalAnswers[index]
        })),
        timeTaken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      const loadingToastId = toast.loading('Submitting quiz...');

      try {
        const response = await axios.post(
          'http://localhost:5000/api/quizzes/submit',
          submission,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        toast.dismiss(loadingToastId);

        if (response.data?.result?.quizId) {
          // Save attempt data
          localStorage.setItem('lastQuizAttempt', JSON.stringify({
            quizId: response.data.result.quizId,
            userId: user.id,
            category,
            timestamp: new Date().toISOString(),
            score: response.data.result.score || 0
          }));

          toast.success('Quiz submitted successfully!');
          // Save quiz data and navigate to performance page
          navigate('/performance', { 
            replace: true,
            state: { 
              quizId: response.data.result.quizId,
              fromQuiz: true,
              category: category,
              score: response.data.result.score || 0
            }
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (submitError) {
        toast.dismiss(loadingToastId);
        console.error('Submission error:', submitError);
        const errorMessage = submitError.response?.data?.message || submitError.message || 'Failed to submit quiz';
        toast.error(errorMessage);
        
        // Handle different error cases
        if (submitError.response?.status === 401) {
          // Token expired or invalid, store current location and redirect to login
          localStorage.setItem('returnPath', `/quiz/${category}`);
          navigate('/login');
        } else if (submitError.response?.status === 429) {
          // Attempt limit reached
          navigate('/dashboard');
        } else {
          // For other errors, stay on the page and show error message
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      if (err.response?.status === 429) {
        setIsAttemptLimitReached(true);
        setAttemptsLeft(0);
        setNextAttemptTime(err.response.data.nextAttemptTime);
        navigate('/dashboard');
        toast.error(err.response.data.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
        // For general errors, redirect to dashboard
        navigate('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    category,
    answers,
    startTime,
    navigate,
    isSubmitting,
    user,
    optionMappings,
    originalQuestions,
    checkAttemptLimits,
    setIsAttemptLimitReached,
    setAttemptsLeft,
    setNextAttemptTime,
    setError
  ]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  // Handle answer selection
  const handleAnswer = (selectedOption) => {
    if (isSubmitting) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading quiz questions...</div>
      </div>
    );
  }

  if (isAttemptLimitReached) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Attempt Limit Reached</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">
                You have reached the maximum limit of 3 attempts for today.
              </p>
              <p className="text-red-800 mt-2">
                Next attempt available at: {nextAttemptTime ? new Date(nextAttemptTime).toLocaleString() : 'Tomorrow'}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">No questions available for this category.</div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto" ref={questionContainerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{category} Quiz</h1>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            <div className="text-xl font-semibold text-primary-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
          {/* Attempts Information */}
          <div className={`p-3 rounded-lg ${attemptsLeft > 1 ? 'bg-blue-50' : 'bg-yellow-50'}`}>
            <p className={`${attemptsLeft > 1 ? 'text-blue-800' : 'text-yellow-800'} font-medium`}>
              {attemptsLeft === 3 && 'You have 3 attempts available today'}
              {attemptsLeft === 2 && 'You have 2 attempts remaining today'}
              {attemptsLeft === 1 && 'This is your last attempt for today!'}
            </p>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl text-gray-900 mb-4">
            {currentQuestionData.questionText}
          </h2>
          <div className="space-y-3">
            {currentQuestionData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={isSubmitting}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  answers[currentQuestion] === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-500'
                } ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || isSubmitting}
            className={`px-6 py-2 rounded-md ${
              currentQuestion === 0 || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            } text-white`}
          >
            Previous
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white flex items-center justify-center min-w-[120px]`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md ${
                isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              } text-white`}
            >
              Next
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${(answers.filter(a => a !== null).length / questions.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Quiz; 