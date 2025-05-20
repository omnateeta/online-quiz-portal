import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';

ChartJS.register(ArcElement, Tooltip, Legend);

const Results = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        // Verify authentication
        if (!user?._id) {
          toast.error('Please login to view results');
          navigate('/login', { state: { from: `/results/${quizId}` } });
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication token not found');
          navigate('/login');
          return;
        }

        // Show loading toast
        const loadingToastId = toast.loading('Loading quiz results...');

        try {
          // Fetch quiz attempt
          const response = await axios.get(
            `http://localhost:5000/api/quizzes/attempt/${quizId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.data?.quizAttempt) {
            throw new Error('Quiz result not found');
          }

          setQuizResult(response.data.quizAttempt);
          toast.success('Results loaded successfully!');

          // If score is >= 50%, fetch certificate
          if (response.data.quizAttempt.totalScore >= 50) {
            try {
              const certResponse = await axios.get(
                `http://localhost:5000/api/certificates/quiz/${quizId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (certResponse.data) {
                setCertificate(certResponse.data);
              }
            } catch (certError) {
              console.error('Certificate fetch error:', certError);
              toast.warning('Unable to load certificate');
            }
          }
        } catch (err) {
          console.error('Failed to fetch quiz result:', err);
          throw new Error(err.response?.data?.message || 'Failed to load quiz results');
        } finally {
          toast.dismiss(loadingToastId);
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
        
        // Redirect to dashboard if quiz not found
        if (err.message.includes('not found')) {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResult();
  }, [quizId, user, navigate]);

  const handleDownloadCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !certificate) {
        throw new Error('Unable to download certificate');
      }

      const loadingToastId = toast.loading('Downloading certificate...');

      const response = await axios.get(
        `http://localhost:5000/api/certificates/${certificate._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToastId);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

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

  if (!quizResult) return null;

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

          {/* Certificate Section */}
          {quizResult.totalScore >= 50 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    🎉 Congratulations!
                  </h2>
                  <div className="space-y-2">
                    <p className="text-green-700 text-lg">
                      You've successfully completed the {quizResult.category} quiz with {quizResult.totalScore.toFixed(1)}% score!
                    </p>
                    {certificate && (
                      <p className="text-green-600">
                        Certificate Number: <span className="font-mono font-medium">{certificate.certificateNumber}</span>
                      </p>
                    )}
                    <p className="text-sm text-green-600">
                      Date Achieved: {new Date(quizResult.startTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={!certificate}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 
                    transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 
                    disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Certificate
                </button>
              </div>
            </div>
          )}

          {/* Question Analysis */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Question Analysis</h2>
            {quizResult.questions.map((question, index) => (
              <div
                key={question._id}
                className={`p-6 rounded-lg border ${
                  question.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span 
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                      question.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-grow">
                    <p className="font-medium mb-3">{question.question.questionText}</p>
                    <div className="space-y-2">
                      <p className={`text-sm ${
                        question.selectedAnswer === -1 
                          ? 'text-yellow-600' 
                          : question.isCorrect 
                            ? 'text-green-600' 
                            : 'text-red-600'
                      }`}>
                        <span className="font-medium">Your Answer:</span>{' '}
                        {question.selectedAnswer === -1 
                          ? 'Not answered' 
                          : question.question.options[question.selectedAnswer]
                        }
                      </p>
                      {!question.isCorrect && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Correct Answer:</span>{' '}
                          {question.question.options[question.question.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {question.isCorrect ? (
                      <span className="text-green-600 text-2xl">✓</span>
                    ) : (
                      <span className="text-red-600 text-2xl">✗</span>
                    )}
                  </div>
                </div>
                {!question.isCorrect && question.question.explanation && (
                  <div className="mt-4 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                    <span className="font-medium">Explanation:</span>{' '}
                    {question.question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 
                transition-colors"
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