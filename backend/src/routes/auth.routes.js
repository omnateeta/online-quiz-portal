import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', body('email').isEmail(), authController.forgotPassword);
router.post('/reset-password/:token', body('password').isLength({ min: 6 }), authController.resetPassword);
router.get('/verify-token', authController.verifyToken);

export default router; 