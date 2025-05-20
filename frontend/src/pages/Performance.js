import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
import { Bar } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

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
  'Aptitude': 'rgba(255, 99, 132, 0.3)',
  'Logical Reasoning': 'rgba(54, 162, 235, 0.3)',
  'Technical': 'rgba(255, 206, 86, 0.3)',
  'General Knowledge': 'rgba(75, 192, 192, 0.3)'
};

const categoryBorderColors = {
  'Aptitude': 'rgba(255, 99, 132, 1)',
  'Logical Reasoning': 'rgba(54, 162, 235, 1)',
  'Technical': 'rgba(255, 206, 86, 1)',
  'General Knowledge': 'rgba(75, 192, 192, 1)'
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 14
        },
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: true,
      text: 'Performance by Category',
      font: {
        size: 18,
        weight: 'bold'
      },
      padding: {
        top: 10,
        bottom: 20
      },
      color: '#374151'
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = typeof context.raw === 'number' ? context.raw.toFixed(1) : '0.0';
          return `Score: ${value}%`;
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1f2937',
      bodyColor: '#1f2937',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      usePointStyle: true
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
          weight: 'bold',
          size: 14
        },
        color: '#374151'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: '#4b5563',
        font: {
          size: 12
        },
        padding: 8
      }
    },
    x: {
      title: {
        display: true,
        text: 'Categories',
        font: {
          weight: 'bold',
          size: 14
        },
        color: '#374151',
        padding: {
          top: 15
        }
      },
      grid: {
        display: false
      },
      ticks: {
        color: '#4b5563',
        font: {
          size: 12
        },
        padding: 8
      }
    }
  }
};

const Performance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const certificateRef = useRef(null);
  const [certificateImage, setCertificateImage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Get quiz submission data if coming from quiz
  const quizSubmissionData = location.state;

  // Function to generate certificate image
  const generateCertificateImage = async () => {
    if (!certificateRef.current) return null;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      return canvas.toDataURL('image/jpeg', 1.0);
    } catch (err) {
      console.error('Error generating certificate image:', err);
      return null;
    }
  };

  // Function to generate and download certificate
  const generateCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      const imgData = await generateCertificateImage();
      if (!imgData) return;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${user.username}-${quizSubmissionData.category}-Certificate.pdf`);

      // Store the image for sharing
      setCertificateImage(imgData);
    } catch (err) {
      console.error('Error generating certificate:', err);
    }
  };

  // Function to handle social media sharing
  const handleShare = async (platform) => {
    if (!certificateImage) {
      const imgData = await generateCertificateImage();
      setCertificateImage(imgData);
    }

    const shareText = `I completed the ${quizSubmissionData.category} Quiz with a score of ${quizSubmissionData.score}%! 🎉`;
    const shareUrl = window.location.href;

    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
        break;
      case 'native':
        try {
          await navigator.share({
            title: 'Quiz Certificate',
            text: shareText,
            url: shareUrl
          });
        } catch (err) {
          console.error('Error sharing:', err);
        }
        break;
      default:
        break;
    }
    setShowShareModal(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch analytics
        const analyticsResponse = await axios.get(
          `http://localhost:5000/api/quizzes/analytics/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('Fetched analytics:', analyticsResponse.data);

        setAnalytics(analyticsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDownloadCertificate = async (quizId, certificateNumber) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First get the certificate ID for this quiz
      const certResponse = await axios.get(
        `http://localhost:5000/api/certificates/quiz/${quizId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!certResponse.data) {
        throw new Error('Certificate not found');
      }

      // Now download the certificate PDF
      const response = await axios.get(
        `http://localhost:5000/api/certificates/${certResponse.data._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
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

  const categories = ['Aptitude', 'Logical Reasoning', 'Technical', 'General Knowledge'];
  
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Average Score (%)',
        data: categories.map(category => {
          const score = analytics?.categoryWise[category]?.averageScore;
          return typeof score === 'number' ? Number(score.toFixed(1)) : 0;
        }),
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

  // Share Modal Component
  const ShareModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Share Certificate</h3>
          <button 
            onClick={() => setShowShareModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleShare('linkedin')}
            className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-[#0077B5] text-white hover:bg-[#006399] transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span>LinkedIn</span>
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            <span>Twitter</span>
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-[#1877F2] text-white hover:bg-[#166fe5] transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
          {'share' in navigator && (
            <button
              onClick={() => handleShare('native')}
              className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

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

      {/* Show recent quiz submission message and certificate if score > 50% */}
      {quizSubmissionData?.fromQuiz && (
        <div className="space-y-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  Quiz Completed Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Category: {quizSubmissionData.category}</p>
                  <p>Score: {quizSubmissionData.score}%</p>
                  <p className="mt-1">View your overall performance analysis below.</p>
                </div>
              </div>
            </div>
          </div>

          {quizSubmissionData.score > 50 && (
            <>
              {/* Certificate Template */}
              <div 
                ref={certificateRef} 
                className="bg-white border-8 border-double border-gray-300 p-8 rounded-lg shadow-lg max-w-4xl mx-auto"
                style={{ 
                  aspectRatio: '1.414', 
                  backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
                }}
              >
                <div className="text-center space-y-6">
                  <div className="text-4xl font-serif text-gray-800 mb-2">Certificate of Achievement</div>
                  <div className="text-xl text-gray-600">This is to certify that</div>
                  <div className="text-3xl font-bold text-primary-600 my-4">{user.username}</div>
                  <div className="text-xl text-gray-600">
                    has successfully completed the {quizSubmissionData.category} Quiz
                    <br />with a score of {quizSubmissionData.score}%
                  </div>
                  <div className="text-lg text-gray-500 mt-8">
                    Date: {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="mt-12 flex justify-center space-x-16">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 w-48 pt-2">Quiz Administrator</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 w-48 pt-2">Digital Signature</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download and Share Buttons */}
              <div className="text-center space-x-4">
                <button
                  onClick={generateCertificate}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Certificate</span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share Certificate</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && <ShareModal />}

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
                  onClick={() => handleDownloadCertificate(activity._id, `CERT-${new Date(activity.date).toISOString().slice(0,7)}-${String(activity.questionsAnswered).padStart(4, '0')}`)}
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Correct</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-purple-100">
              {analytics?.recentActivity?.map((activity, index) => (
                <tr key={index} className="hover:bg-indigo-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(activity.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${activity.category === 'Aptitude' ? 'bg-red-100 text-red-800' :
                        activity.category === 'Logical Reasoning' ? 'bg-blue-100 text-blue-800' :
                        activity.category === 'Technical' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {activity.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${activity.score >= 80 ? 'bg-green-100 text-green-800' :
                        activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {activity.score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.questionsAnswered}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${(activity.correctAnswers / activity.questionsAnswered) >= 0.8 ? 'bg-green-100 text-green-800' :
                        (activity.correctAnswers / activity.questionsAnswered) >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {activity.correctAnswers}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {categories.map(category => (
          <div key={category} className={`rounded-lg shadow-md p-6 ${
            category === 'Aptitude' ? 'bg-gradient-to-br from-red-50 to-red-100' :
            category === 'Logical Reasoning' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
            category === 'Technical' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' :
            'bg-gradient-to-br from-green-50 to-green-100'
          }`}>
            <h3 className={`text-xl font-semibold mb-4 ${
              category === 'Aptitude' ? 'text-red-800' :
              category === 'Logical Reasoning' ? 'text-blue-800' :
              category === 'Technical' ? 'text-yellow-800' :
              'text-green-800'
            }`}>{category}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg">
                <span className={`font-medium ${
                  category === 'Aptitude' ? 'text-red-700' :
                  category === 'Logical Reasoning' ? 'text-blue-700' :
                  category === 'Technical' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>Total Attempts:</span>
                <span className="font-medium">{analytics?.categoryWise[category]?.totalAttempts || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg">
                <span className={`font-medium ${
                  category === 'Aptitude' ? 'text-red-700' :
                  category === 'Logical Reasoning' ? 'text-blue-700' :
                  category === 'Technical' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>Average Score:</span>
                <span className="font-medium">{(analytics?.categoryWise[category]?.averageScore || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg">
                <span className={`font-medium ${
                  category === 'Aptitude' ? 'text-red-700' :
                  category === 'Logical Reasoning' ? 'text-blue-700' :
                  category === 'Technical' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>Best Score:</span>
                <span className="font-medium">{(analytics?.categoryWise[category]?.bestScore || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg">
                <span className={`font-medium ${
                  category === 'Aptitude' ? 'text-red-700' :
                  category === 'Logical Reasoning' ? 'text-blue-700' :
                  category === 'Technical' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>Total Questions:</span>
                <span className="font-medium">{analytics?.categoryWise[category]?.totalQuestions || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg">
                <span className={`font-medium ${
                  category === 'Aptitude' ? 'text-red-700' :
                  category === 'Logical Reasoning' ? 'text-blue-700' :
                  category === 'Technical' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>Correct Answers:</span>
                <span className="font-medium">{analytics?.categoryWise[category]?.correctAnswers || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Performance Chart</h2>
        <div className="h-96 bg-white rounded-lg p-4">
          <Bar data={chartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              legend: {
                ...chartOptions.plugins.legend,
                labels: {
                  font: {
                    size: 14
                  },
                  usePointStyle: true,
                  padding: 20,
                  color: '#4b5563'
                }
              }
            },
            scales: {
              ...chartOptions.scales,
              y: {
                ...chartOptions.scales.y,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  drawBorder: false
                },
                ticks: {
                  color: '#4b5563',
                  font: {
                    size: 12
                  }
                }
              },
              x: {
                ...chartOptions.scales.x,
                ticks: {
                  color: '#4b5563',
                  font: {
                    size: 12
                  }
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default Performance; 