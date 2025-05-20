import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartQuiz = (category) => {
    if (user) {
      navigate(`/quiz/${category}`, {
        state: { fromDashboard: true },
        replace: true
      });
    } else {
      navigate('/login', { 
        state: { from: `/quiz/${category}` }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-indigo-900/30"></div>
          <img
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
            alt="Education Background"
            className="w-full h-[500px] object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white text-center mb-6">
            Welcome to Online Quiz Portal
          </h1>
          <p className="text-xl md:text-2xl text-white text-center mb-12 max-w-3xl mx-auto">
            Challenge yourself, learn, and grow with our interactive quizzes across various categories
          </p>
          
          <div className="flex justify-center space-x-6">
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-200"
                >
                  Start Your Journey
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
          <p className="text-lg text-gray-600">Discover the features that make our quiz platform stand out</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 transform hover:-translate-y-2 transition-all duration-300">
            <div className="text-indigo-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Results</h3>
            <p className="text-gray-600">Get detailed feedback and analysis of your performance immediately after completing a quiz</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 transform hover:-translate-y-2 transition-all duration-300">
            <div className="text-indigo-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Tracking</h3>
            <p className="text-gray-600">Monitor your progress over time with detailed analytics and insights</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 transform hover:-translate-y-2 transition-all duration-300">
            <div className="text-indigo-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Diverse Categories</h3>
            <p className="text-gray-600">Choose from a wide range of subjects to test and improve your knowledge</p>
          </div>
        </div>
      </div>

      {/* Quiz Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white/50 rounded-3xl mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Available Quiz Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              name: 'Aptitude',
              icon: '🧮',
              description: 'Test your mathematical and logical thinking abilities',
              color: 'from-blue-500 to-blue-600'
            },
            {
              name: 'Logical Reasoning',
              icon: '🧩',
              description: 'Challenge your problem-solving and analytical skills',
              color: 'from-purple-500 to-purple-600'
            },
            {
              name: 'Technical',
              icon: '💻',
              description: 'Evaluate your technical knowledge and expertise',
              color: 'from-green-500 to-green-600'
            },
            {
              name: 'General Knowledge',
              icon: '🌍',
              description: 'Expand your awareness of the world around you',
              color: 'from-red-500 to-red-600'
            }
          ].map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className={`bg-gradient-to-r ${category.color} p-4`}>
                <span className="text-4xl">{category.icon}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                {user ? (
                  <button
                    onClick={() => handleStartQuiz(category.name)}
                    className="inline-block w-full text-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Start Quiz
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="inline-block w-full text-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Login to Start
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Test Your Knowledge?</h2>
          <p className="text-xl text-indigo-100 mb-8">Join thousands of users who are already improving their skills</p>
          {!user && (
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
            >
              Get Started Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 