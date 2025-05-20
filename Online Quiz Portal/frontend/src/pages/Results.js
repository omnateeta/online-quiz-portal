import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Results = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/quizzes/history/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const result = response.data.quizAttempts.find(attempt => attempt._id === quizId);
        
        if (!result) {
          throw new Error('Quiz result not found');
        }
        
        setQuizResult(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQuizResult();
    }
  }, [quizId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!quizResult) {
    return null;
  }

  const chartData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [
          quizResult.questions.filter(q => q.isCorrect).length,
          quizResult.questions.filter(q => !q.isCorrect).length,
        ],
        backgroundColor: ['#4CAF50', '#f44336'],
        borderColor: ['#43A047', '#E53935'],
        borderWidth: 1,
      },
    ],
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Quiz Results</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-medium">Category:</span> {quizResult.category}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Total Questions:</span> {quizResult.totalQuestions}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Score:</span> {quizResult.totalScore.toFixed(1)}%
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Time Taken:</span> {formatTime(quizResult.timeTaken)}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(quizResult.startTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Performance</h2>
              <div className="w-full h-64">
                <Pie data={chartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Question Analysis</h2>
            {quizResult.questions.map((question, index) => (
              <div
                key={question._id}
                className={`p-4 rounded-lg ${
                  question.isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white">
                    {index + 1}
                  </span>
                  <div className="flex-grow">
                    <p className="font-medium mb-2">{question.question.questionText}</p>
                    <p className="text-sm text-gray-600">
                      Your Answer: Option {question.selectedAnswer + 1}
                    </p>
                    {!question.isCorrect && (
                      <p className="text-sm text-red-600 mt-1">
                        Correct Answer: Option {question.question.correctAnswer + 1}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {question.isCorrect ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results; 