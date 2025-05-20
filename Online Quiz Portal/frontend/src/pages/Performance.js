import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const categoryColors = {
  'Aptitude': 'rgba(255, 99, 132, 0.5)',
  'Logical Reasoning': 'rgba(54, 162, 235, 0.5)',
  'Technical': 'rgba(255, 206, 86, 0.5)',
  'General Knowledge': 'rgba(75, 192, 192, 0.5)'
};

const categoryBorderColors = {
  'Aptitude': 'rgb(255, 99, 132)',
  'Logical Reasoning': 'rgb(54, 162, 235)',
  'Technical': 'rgb(255, 206, 86)',
  'General Knowledge': 'rgb(75, 192, 192)'
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Performance by Category',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => `Score: ${context.raw.toFixed(1)}%`
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
        font: {
          weight: 'bold'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Categories',
        font: {
          weight: 'bold'
        }
      },
      grid: {
        display: false
      }
    }
  }
};

const Performance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(
          `http://localhost:5000/api/quizzes/analytics/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('Frontend received analytics:', response.data);
        setAnalytics(response.data);
      } catch (err) {
        console.error('Analytics error:', err);
        setError(err.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);

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

  const categories = ['Aptitude', 'Logical Reasoning', 'Technical', 'General Knowledge'];
  
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Average Score (%)',
        data: categories.map(category => 
          analytics?.categoryWise[category]?.averageScore.toFixed(1) || 0
        ),
        backgroundColor: categories.map(category => categoryColors[category]),
        borderColor: categories.map(category => categoryBorderColors[category]),
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 40
      }
    ]
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Performance Analysis</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Overall Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600">Total Quizzes</p>
            <p className="text-2xl font-bold text-blue-600">
              {analytics?.overall?.totalQuizzes || 0}
              <span className="text-sm text-gray-500 ml-2">completed</span>
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-600">Average Score</p>
            <p className="text-2xl font-bold text-green-600">
              {(analytics?.overall?.averageScore || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-gray-600">Questions Answered</p>
            <p className="text-2xl font-bold text-purple-600">
              {analytics?.overall?.totalQuestions || 0}
              <span className="text-sm text-gray-500 ml-2">
                ({analytics?.overall?.totalCorrect || 0} correct)
              </span>
            </p>
          </div>
          <div className={`${analytics?.overall?.improvement > 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
            <p className="text-gray-600">Recent Improvement</p>
            <p className={`text-2xl font-bold ${analytics?.overall?.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(analytics?.overall?.improvement || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.recentActivity?.map((activity, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.score.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.questionsAnswered}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.correctAnswers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {categories.map(category => (
          <div key={category} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{category}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Attempts:</span>
                <span className="font-medium">{analytics?.categoryWise[category]?.totalAttempts || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Score:</span>
                <span className="font-medium">{(analytics?.categoryWise[category]?.averageScore || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Best Score:</span>
                <span className="font-medium">{(analytics?.categoryWise[category]?.bestScore || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{analytics?.categoryWise[category]?.totalQuestions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Correct Answers:</span>
                <span className="font-medium">{analytics?.categoryWise[category]?.correctAnswers || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
        <div className="h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Performance; 