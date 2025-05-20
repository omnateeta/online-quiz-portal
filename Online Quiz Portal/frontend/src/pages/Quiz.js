import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Quiz = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [startTime] = useState(new Date());

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/quiz/${category}` } });
      return;
    }
  }, [user, navigate, category]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(
          `http://localhost:5000/api/quizzes/${category}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!response.data.questions || response.data.questions.length === 0) {
          throw new Error('No questions available for this category');
        }

        setQuestions(response.data.questions);
        setAnswers(new Array(response.data.questions.length).fill(null));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load quiz questions';
        setError(errorMessage);
        toast.error(errorMessage);
        if (err.response?.status === 401) {
          navigate('/login', { state: { from: `/quiz/${category}` } });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQuestions();
    }
  }, [category, user, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endTime = new Date();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

      // Validate that all questions are answered
      const unansweredCount = answers.filter(a => a === null).length;
      if (unansweredCount > 0) {
        const confirmSubmit = window.confirm(
          `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
        );
        if (!confirmSubmit) {
          return;
        }
      }

      const submission = {
        category,
        answers: questions.map((q, index) => ({
          questionId: q._id,
          selectedAnswer: answers[index] ?? -1 // Use -1 for unanswered questions
        })),
        timeTaken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      const response = await axios.post(
        'http://localhost:5000/api/quizzes/submit',
        submission,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.result) {
        toast.success('Quiz submitted successfully!');
        navigate(`/results/${response.data.result.quizId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit quiz';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/quiz/${category}` } });
      }
    }
  }, [category, questions, answers, startTime, navigate]);

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

  const handleAnswer = (selectedOption) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);
  };

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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
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
                className={`w-full text-left p-4 rounded-lg border ${
                  answers[currentQuestion] === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-500'
                }`}
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
            disabled={currentQuestion === 0}
            className={`px-6 py-2 rounded-md ${
              currentQuestion === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            } text-white`}
          >
            Previous
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
            >
              Next
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full"
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