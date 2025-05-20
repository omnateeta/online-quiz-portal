import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    category: 'Aptitude',
    difficulty: 'Medium',
    explanation: ''
  });

  // Define categories array for reuse
  const categories = ['Aptitude', 'Logical Reasoning', 'Technical', 'General Knowledge'];

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [questionsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/questions', { headers }),
        axios.get('http://localhost:5000/api/admin/users', { headers })
      ]);

      setQuestions(questionsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${userId}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/questions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData({
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: 'Aptitude',
        difficulty: 'Medium',
        explanation: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question._id);
    setFormData({
      questionText: question.questionText,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      category: question.category,
      difficulty: question.difficulty,
      explanation: question.explanation || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/questions/${editingQuestion}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData({
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: 'Aptitude',
        difficulty: 'Medium',
        explanation: ''
      });
      setEditingQuestion(null);
      fetchData();
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const handleCancel = () => {
    setEditingQuestion(null);
    setFormData({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      category: 'Aptitude',
      difficulty: 'Medium',
      explanation: ''
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Prepare chart data for user performance
  const userPerformanceData = {
    labels: users.map(u => u.email),
    datasets: [
      {
        label: 'Average Score',
        data: users.map(u => u.averageScore),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      }
    ]
  };

  // Prepare pie chart data for question categories
  const categoryData = {
    labels: categories,
    datasets: [{
      data: categories.map(category => 
        questions.filter(q => q.category === category).length
      ),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-purple-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">Question Categories</h2>
          <Pie data={categoryData} />
        </div>
        <div className="bg-indigo-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800">User Performance</h2>
          <Bar 
            data={userPerformanceData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Average Score (%)',
                    color: '#4338ca'
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: '#4338ca'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-cyan-50 rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-semibold mb-4 text-cyan-800">User Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cyan-200">
            <thead className="bg-cyan-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-800 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-800 uppercase tracking-wider">Total Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-800 uppercase tracking-wider">Average Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-800 uppercase tracking-wider">Last Attempt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-cyan-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-cyan-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800">
                      {user.totalAttempts}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.averageScore >= 80 ? 'bg-green-100 text-green-800' :
                      user.averageScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.averageScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-900">
                    {user.lastAttempt ? new Date(user.lastAttempt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => fetchUserAnalytics(user._id)}
                      className="text-cyan-600 hover:text-cyan-900 font-medium hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected User Analytics */}
      {userAnalytics && (
        <div className="bg-amber-50 rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-amber-800">
            Detailed Analytics for {userAnalytics.user.email}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-amber-800">Category Performance</h3>
              <div className="space-y-4">
                {Object.entries(userAnalytics.categoryWiseStats).map(([category, stats]) => (
                  <div key={category} className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow">
                    <h4 className="font-medium text-amber-900">{category}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-amber-100 p-3 rounded-lg">
                        <p className="text-sm text-amber-800">Attempts</p>
                        <p className="text-lg font-medium text-amber-900">{stats.totalAttempts}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        stats.averageScore >= 80 ? 'bg-green-100' :
                        stats.averageScore >= 60 ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        <p className="text-sm text-amber-800">Average Score</p>
                        <p className="text-lg font-medium text-amber-900">{stats.averageScore.toFixed(1)}%</p>
                      </div>
                      <div className="bg-amber-100 p-3 rounded-lg">
                        <p className="text-sm text-amber-800">Total Questions</p>
                        <p className="text-lg font-medium text-amber-900">{stats.totalQuestions}</p>
                      </div>
                      <div className="bg-amber-100 p-3 rounded-lg">
                        <p className="text-sm text-amber-800">Correct Answers</p>
                        <p className="text-lg font-medium text-amber-900">{stats.correctAnswers}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3 text-amber-800">Recent Attempts</h3>
              <div className="space-y-4">
                {userAnalytics.recentAttempts.map((attempt) => (
                  <div key={attempt._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-amber-900">{attempt.category}</h4>
                        <p className="text-sm text-amber-600">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-medium ${
                          attempt.totalScore >= 80 ? 'text-green-600' :
                          attempt.totalScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {attempt.totalScore.toFixed(1)}%
                        </p>
                        <p className="text-sm text-amber-600">
                          {attempt.questions.filter(q => q.isCorrect).length} / {attempt.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Management */}
      <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </h2>
        <form onSubmit={editingQuestion ? handleUpdate : handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Question Text</label>
            <textarea
              name="questionText"
              value={formData.questionText}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Options</label>
            {formData.options.map((option, index) => (
              <div key={index} className="mt-1">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
                  placeholder={`Option ${index + 1}`}
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
            <select
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
            >
              {formData.options.map((_, index) => (
                <option key={index} value={index}>Option {index + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Explanation</label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
            {editingQuestion && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Questions List */}
      <div className="bg-green-50 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Questions</h2>
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question._id} className="border-b pb-4 bg-white p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <p className="font-medium">{question.questionText}</p>
                  <ul className="mt-2 space-y-1">
                    {question.options.map((option, index) => (
                      <li key={index} className={index === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                        {index + 1}. {option}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">
                    Category: <span className="font-medium">{question.category}</span> | 
                    Difficulty: <span className={`font-medium ${
                      question.difficulty === 'Easy' ? 'text-green-600' :
                      question.difficulty === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{question.difficulty}</span>
                  </p>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mt-1">
                      Explanation: {question.explanation}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="text-red-600 hover:text-red-800 px-3 py-1 rounded-md border border-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 