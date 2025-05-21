import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = 'https://online-quiz-portal-9icc.onrender.com';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/auth/verify-token`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.user) {
        const userData = {
          ...response.data.user,
          _id: response.data.user._id || response.data.user.id,
          id: response.data.user._id || response.data.user.id
        };
        console.log('Auth check - User data:', userData);
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/api/auth/login`);
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, 
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('Login response:', response.data);
      const { token, user: userData } = response.data;
      
      if (token && userData) {
        const processedUserData = {
          ...userData,
          _id: userData._id || userData.id,
          id: userData._id || userData.id
        };
        
        localStorage.setItem('token', token);
        setUser(processedUserData);
        console.log('Login successful - User data:', processedUserData);
        
        return { 
          success: true, 
          isAdmin: processedUserData.isAdmin,
          error: null 
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      toast.error(errorMessage);
      return {
        success: false,
        isAdmin: false,
        error: errorMessage
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        email,
        password
      });
      
      const { token, user: userData } = response.data;
      
      if (token && userData) {
        // Ensure user object has both _id and id fields
        const processedUserData = {
          ...userData,
          _id: userData._id || userData.id,
          id: userData._id || userData.id
        };
        
        localStorage.setItem('token', token);
        setUser(processedUserData);
        console.log('Register - User data:', processedUserData);
        return { success: true, user: processedUserData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send reset email'
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        password
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset password'
      };
    }
  };

  const updateUser = (updatedUserData) => {
    // Ensure user object has both _id and id fields
    const processedUserData = {
      ...updatedUserData,
      _id: updatedUserData._id || updatedUserData.id,
      id: updatedUserData._id || updatedUserData.id
    };
    console.log('Updating user data:', processedUserData);
    setUser(processedUserData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    isAdmin: user?.isAdmin || false,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 