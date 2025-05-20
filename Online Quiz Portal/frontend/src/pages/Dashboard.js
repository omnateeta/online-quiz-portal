import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/quizzes/analytics/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setAnalytics(response.data);
      } catch (err) {
        setError('Failed to fetch analytics');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">Welcome back, {user.username}! 👋</p>
        </div>
        <Link
          to="/performance"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          View Performance Analysis
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.overall.totalAttempts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.overall.averageScore.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Categories Attempted</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(analytics?.categoryWise || {}).filter(cat => cat.totalAttempts > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Categories */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-xl mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(categoryImages).map(([category, imageUrl]) => (
            <Link
              key={category}
              to={`/quiz/${category}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative z-10">
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <img src={imageUrl} alt={category} className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{category}</h3>
                <p className="text-gray-600 text-center text-sm mb-4">
                  Test your {category.toLowerCase()} skills
                </p>
                <div className="text-primary-600 text-center font-medium group-hover:text-primary-700 relative">
                  <span className="relative inline-flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    Start Quiz 
                    <svg 
                      className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
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

      {/* Footer */}
      <footer className="bg-white rounded-lg shadow-md mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Us</h3>
              <p className="text-gray-600">
                We provide a comprehensive online quiz platform to help students test and improve their knowledge across various subjects.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">Dashboard</Link>
                </li>
                <li>
                  <Link to="/performance" className="text-gray-600 hover:text-primary-600">Performance</Link>
                </li>
                <li>
                  <a href="#categories" className="text-gray-600 hover:text-primary-600">Categories</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <ul className="space-y-2">
                {Object.keys(categoryImages).map(category => (
                  <li key={category}>
                    <Link 
                      to={`/quiz/${category}`} 
                      className="text-gray-600 hover:text-primary-600"
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li className="text-gray-600">
                  <span className="font-medium">Email:</span> support@quizportal.com
                </li>
                <li className="text-gray-600">
                  <span className="font-medium">Phone:</span> +1 234 567 890
                </li>
                <li className="text-gray-600">
                  <span className="font-medium">Address:</span> 123 Quiz Street, Knowledge City
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              © {new Date().getFullYear()} Quiz Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 