# Online Quiz Portal 
-A full-stack web application for conducting online MCQ quizzes with category-wise assessment.

## Features

- User authentication (Register, Login, Forgot Password)
- MCQ quizzes categorized by topics
- Real-time quiz evaluation
- Performance analytics dashboard
- Category-wise score analysis
- Responsive UI with modern design

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- React Router DOM
- Context API for state management
- Chart.js for analytics

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email services

## Project Structure

```
online-quiz-portal/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context API files
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   └── public/            # Static files
│
├── backend/                # Node.js backend application
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/         # Utility functions
│   └── config/            # Configuration files
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password

### Quiz Endpoints
- GET /api/quizzes - Get all quizzes
- GET /api/quizzes/:category - Get quizzes by category
- POST /api/quizzes/submit - Submit quiz answers
- GET /api/quizzes/results/:userId - Get user's quiz results

## Contributing
Feel free to submit issues and enhancement requests..
