import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Get user's certificates directly from the certificates endpoint
        const certificatesResponse = await axios.get(
          'http://localhost:5000/api/certificates/user',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!certificatesResponse.data || certificatesResponse.data.length === 0) {
          // If no certificates found, try to get from quiz attempts
          const analyticsResponse = await axios.get(
            `http://localhost:5000/api/quizzes/analytics/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          // Filter activities with score >= 50%
          const passingAttempts = analyticsResponse.data.recentActivity
            .filter(activity => activity.score >= 50)
            .map(activity => ({
              _id: activity._id,
              category: activity.category,
              score: activity.score,
              date: activity.date,
              questionsAnswered: activity.questionsAnswered,
              correctAnswers: activity.correctAnswers,
              certificateNumber: `CERT-${new Date(activity.date).toISOString().slice(0,7)}-${String(activity.questionsAnswered).padStart(4, '0')}`
            }));

          setCertificates(passingAttempts);
        } else {
          // Use the certificates from the certificates endpoint
          setCertificates(certificatesResponse.data);
        }
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(err.response?.data?.message || 'Failed to fetch certificates');
        toast.error('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  const handleDownload = async (quizId, certificateNumber) => {
    const loadingToast = toast.loading('Downloading certificate...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First ensure the certificate exists
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
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      if (error.response?.status === 404) {
        toast.error('Certificate not found. Please try again later.');
      } else {
        toast.error('Failed to download certificate. Please try again.');
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleView = async (quizId, certificateNumber) => {
    const loadingToast = toast.loading('Loading certificate...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First ensure the certificate exists
      const certResponse = await axios.get(
        `http://localhost:5000/api/certificates/quiz/${quizId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!certResponse.data) {
        throw new Error('Certificate not found');
      }

      // Now get the certificate PDF
      const response = await axios.get(
        `http://localhost:5000/api/certificates/${certResponse.data._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create object URL for viewing
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Certificate - ${certificateNumber}</title>
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                }
                iframe {
                  flex: 1;
                  border: none;
                  width: 100%;
                }
              </style>
            </head>
            <body>
              <iframe src="${url}" type="application/pdf"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // If popup blocked, open in same window
        window.location.href = url;
      }

      toast.success('Certificate opened successfully!');
    } catch (error) {
      console.error('Error viewing certificate:', error);
      if (error.response?.status === 404) {
        toast.error('Certificate not found. Please try again later.');
      } else {
        toast.error('Failed to view certificate. Please try again.');
      }
    } finally {
      toast.dismiss(loadingToast);
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
        <Link
          to="/dashboard"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600 mt-2">View and download your earned certificates</p>
        </div>
        <Link
          to="/dashboard"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                  {cert.category}
                </div>
                <div className="text-green-600 font-semibold">
                  {cert.score.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">
                  Certificate No: {cert.certificateNumber}
                </p>
                <p className="text-gray-600 text-sm">
                  Completed on: {new Date(cert.date || cert.createdAt).toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-sm">
                  Questions: {cert.correctAnswers || cert.quizAttempt?.correctAnswers} / {cert.questionsAnswered || cert.quizAttempt?.totalQuestions} correct
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleView(cert.quizAttempt?._id || cert._id, cert.certificateNumber)}
                    className="flex-1 bg-primary-100 text-primary-800 px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(cert.quizAttempt?._id || cert._id, cert.certificateNumber)}
                    className="flex-1 bg-primary-100 text-primary-800 px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No certificates earned yet. Complete quizzes with a score of 50% or higher to earn certificates!
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates; 