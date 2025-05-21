require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const quizRoutes = require('./routes/quiz.routes');
const adminRoutes = require('./routes/admin.routes');
const certificateRoutes = require('./routes/certificate.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Configuration
const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz-portal',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development'
};

console.log('Starting server with config:', {
  port: config.port,
  nodeEnv: config.nodeEnv,
  mongoUri: config.mongoUri ? 'configured' : 'not configured'
});

// Middleware
app.use(cors({
  origin: ['https://online-quiz-portal-wine.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Debug middleware for quiz submission
app.use('/api/quizzes/submit', (req, res, next) => {
  console.log('Quiz Submission Request:', {
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.url
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: config.nodeEnv === 'development' ? err.message : 'Internal Server Error',
    details: config.nodeEnv === 'development' ? err.stack : undefined
  });
});

// Database connection with retry mechanism
const connectWithRetry = async (retries = 5, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`MongoDB connection attempt ${i + 1} of ${retries}`);
      await mongoose.connect(config.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (err) {
      console.error('MongoDB connection error:', {
        error: err.message,
        attempt: i + 1,
        mongoUri: config.mongoUri
      });
      if (i < retries - 1) {
        console.log(`Retrying in ${interval/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  return false;
};

// Start server
const startServer = async () => {
  try {
    const isConnected = await connectWithRetry();
    if (!isConnected) {
      throw new Error('Failed to connect to MongoDB after multiple attempts');
    }

    // Create HTTP server
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Server URL: http://localhost:${config.port}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer()
  .then(() => console.log('Server started successfully'))
  .catch(err => {
    console.error('Server startup failed:', err);
    process.exit(1);
  });

module.exports = app; 