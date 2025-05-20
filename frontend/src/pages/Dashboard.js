import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const categoryImages = {
  'Aptitude': 'https://img.icons8.com/color/96/000000/math.png',
  'Logical Reasoning': 'https://img.icons8.com/color/96/000000/brain.png',
  'Technical': 'https://img.icons8.com/color/96/000000/code.png',
  'General Knowledge': 'https://img.icons8.com/color/96/000000/open-book--v1.png'
};

const advertisementImages = [
  {
    url: 'https://img.freepik.com/free-vector/quiz-word-concept_23-2147844150.jpg',
    title: 'Interactive Learning',
    description: 'Engage with dynamic quizzes designed to make learning fun and effective'
  },
  {
    url: 'https://img.freepik.com/free-vector/business-team-brainstorm-idea-lightbulb-from-jigsaw_1150-35042.jpg',
    title: 'Challenge Yourself',
    description: 'Test your knowledge across multiple domains and compete with peers'
  },
  {
    url: 'https://img.freepik.com/free-vector/self-development-concept_23-2147862098.jpg',
    title: 'Grow Your Skills',
    description: 'Detailed analytics and personalized feedback to help you improve'
  }
];

const QuizCard = ({ category, onStart }) => (
  <div className={`${
    category === 'Aptitude' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' :
    category === 'Logical Reasoning' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' :
    category === 'Technical' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' :
    'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
  } rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border`}>
    <div className="flex items-center justify-center mb-4">
      <img 
        src={categoryImages[category]} 
        alt={category}
        className="w-16 h-16 object-contain"
      />
    </div>
    <h3 className={`text-xl font-semibold mb-4 text-center ${
      category === 'Aptitude' ? 'text-blue-700' :
      category === 'Logical Reasoning' ? 'text-purple-700' :
      category === 'Technical' ? 'text-green-700' :
      'text-orange-700'
    }`}>{category}</h3>
    <p className={`mb-4 text-center ${
      category === 'Aptitude' ? 'text-blue-600' :
      category === 'Logical Reasoning' ? 'text-purple-600' :
      category === 'Technical' ? 'text-green-600' :
      'text-orange-600'
    }`}>
      Test your knowledge in {category.toLowerCase()} with our comprehensive quiz.
    </p>
    <button
      onClick={() => onStart(category)}
      className={`w-full py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-white ${
        category === 'Aptitude' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' :
        category === 'Logical Reasoning' ? 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400' :
        category === 'Technical' ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' :
        'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400'
      }`}
    >
      Start Quiz
    </button>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!isAuthenticated || !user) {
          navigate('/login');
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const userId = user._id || user.id;
        if (!userId) {
          throw new Error('User ID not found');
        }

        console.log('Fetching analytics for user:', userId);
        const response = await axios.get(
          `http://localhost:5000/api/quizzes/analytics/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!response.data) {
          throw new Error('No data received from server');
        }

        console.log('Analytics data received:', response.data);
        setAnalytics(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch analytics';
        setError(errorMessage);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user, isAuthenticated, navigate]);

  const handleStartQuiz = (category) => {
    if (!isAuthenticated) {
      toast.error('Please login to start a quiz');
      navigate('/login', { state: { from: `/quiz/${category}` } });
      return;
    }
    navigate(`/quiz/${category}`, { 
      state: { fromDashboard: true },
      replace: true
    });
  };

  const categories = ['Aptitude', 'Logical Reasoning', 'Technical', 'General Knowledge'];

  // Chart configuration
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Category-wise Performance',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)',
          color: '#374151'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Categories',
          color: '#374151'
        }
      }
    }
  };

  // Prepare chart data
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Average Score',
        data: categories.map(category => 
          analytics?.categoryWise[category]?.averageScore?.toFixed(1) || 0
        ),
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)', // blue
          'rgba(139, 92, 246, 0.6)',  // purple
          'rgba(34, 197, 94, 0.6)',   // green
          'rgba(249, 115, 22, 0.6)'   // orange
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)'
        ],
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  };

  const getBestPerformance = (activity) => {
    if (!activity || activity.length === 0) return null;
    return activity.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const getLowestPerformance = (activity) => {
    if (!activity || activity.length === 0) return null;
    return activity.reduce((lowest, current) => 
      current.score < lowest.score ? current : lowest
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg shadow-md p-6 mb-8 border border-primary-200">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          {user.profilePicUrl ? (
            <img
              src={user.profilePicUrl}
              alt={user.username}
              className="h-24 w-24 rounded-full object-cover border-4 border-primary-200 shadow-lg"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary-200 shadow-lg">
              {user.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-primary-100">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Welcome back, {user.username}! 👋
              </h1>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <span className="text-blue-600 font-medium">Email:</span>
                  <p className="text-blue-800">{user.email}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                  <span className="text-purple-600 font-medium">Member Since:</span>
                  <p className="text-purple-800">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
            <p className="text-lg text-gray-600">Track your quiz performance</p>
          </div>
          <Link
            to="/performance"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Detailed Analysis
          </Link>
        </div>

        {/* Stats Cards with lighter colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-300 border border-blue-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-50 mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-blue-800 text-sm font-medium">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-900">{analytics?.overall.totalAttempts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-300 border border-green-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-50 mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold text-green-900">{analytics?.overall.averageScore?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-300 border border-purple-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-50 mr-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-purple-800 text-sm font-medium">Categories Attempted</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.values(analytics?.categoryWise || {}).filter(cat => cat.totalAttempts > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity with lighter colors */}
      <div className="mb-12 bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Quiz Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform duration-300 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-800">Latest Quiz</h3>
              <span className="text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {analytics?.recentActivity?.[0]?.category || 'N/A'}
              </span>
            </div>
            <p className="text-lg font-semibold text-purple-900">
              Score: {analytics?.recentActivity?.[0]?.score || 0}%
            </p>
            <p className="text-sm text-purple-600 mt-2">
              {analytics?.recentActivity?.[0]?.date 
                ? new Date(analytics.recentActivity[0].date).toLocaleDateString()
                : 'No attempts yet'}
            </p>
          </div>

          {/* Best Performance Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform duration-300 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-800">Best Performance</h3>
              <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                {getBestPerformance(analytics?.recentActivity)?.category || 'N/A'}
              </span>
            </div>
            <p className="text-lg font-semibold text-green-900">
              Score: {getBestPerformance(analytics?.recentActivity)?.score || 0}%
            </p>
            <p className="text-sm text-green-600 mt-2">
              {getBestPerformance(analytics?.recentActivity)?.date
                ? new Date(getBestPerformance(analytics?.recentActivity).date).toLocaleDateString()
                : 'No attempts yet'}
            </p>
          </div>

          {/* Improvement Areas Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform duration-300 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-orange-800">Areas to Improve</h3>
              <span className="text-sm text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Focus Areas
              </span>
            </div>
            <p className="text-lg font-semibold text-orange-900">
              Lowest Score: {getLowestPerformance(analytics?.recentActivity)?.category || 'N/A'}
            </p>
            <p className="text-sm text-orange-600 mt-2">
              Score: {getLowestPerformance(analytics?.recentActivity)?.score || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Categories with lighter background */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 p-8 rounded-xl mb-12 border border-blue-200" id="quiz-categories">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <QuizCard
              key={category}
              category={category}
              onStart={handleStartQuiz}
            />
          ))}
        </div>
      </div>

      {/* Performance Chart Section with lighter background */}
      <div className="bg-gradient-to-r from-green-50 via-teal-50 to-green-100 p-8 rounded-xl mb-12 border border-green-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Chart</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          {analytics ? (
            <Bar options={chartOptions} data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No performance data available yet. Complete some quizzes to see your progress!
            </div>
          )}
        </div>
      </div>

      {/* Certificates Section */}
      <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 p-8 rounded-xl mb-12 border border-yellow-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Earned Certificates</h2>
          <Link
            to="/certificates"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            View All Certificates
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analytics?.recentActivity?.filter(activity => activity.score >= 50).slice(0, 3).map((activity) => (
            <div 
              key={activity._id}
              className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  {activity.category}
                </div>
                <div className="text-green-600 font-semibold">
                  {activity.score.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">
                  Completed on: {new Date(activity.date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-sm">
                  Questions: {activity.correctAnswers} / {activity.questionsAnswered} correct
                </p>
                <button
                  onClick={() => window.open(`/certificates/${activity._id}/download`, '_blank')}
                  className="w-full mt-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Download Certificate
                </button>
              </div>
            </div>
          ))}
          {(!analytics?.recentActivity || analytics.recentActivity.filter(a => a.score >= 50).length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No certificates earned yet. Complete quizzes with a score of 50% or higher to earn certificates!
            </div>
          )}
        </div>
      </div>

      {/* Advertisement Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Unlock Your Learning Potential</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {advertisementImages.map((ad, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div className="h-48 overflow-hidden">
                <img 
                  src={ad.url} 
                  alt={ad.title} 
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              </div>
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <h3 className="text-xl font-semibold text-primary-600 mb-3">{ad.title}</h3>
                <p className="text-gray-700 leading-relaxed">{ad.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 