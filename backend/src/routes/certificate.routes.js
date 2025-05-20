const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const authMiddleware = require('../middleware/auth.middleware');
const Certificate = require('../models/certificate.model');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user's certificates
router.get('/user', certificateController.getUserCertificates);

// Get certificate by quiz attempt
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ quizAttempt: req.params.quizId });
    
    if (!certificate) {
      // If certificate doesn't exist, try to generate it
      const generatedCertificate = await certificateController.generateCertificate(req.params.quizId);
      
      if (!generatedCertificate) {
        return res.status(404).json({ message: 'Certificate not found and could not be generated' });
      }
      
      return res.json(generatedCertificate);
    }
    
    res.json(certificate);
  } catch (error) {
    console.error('Error fetching/generating certificate:', error);
    res.status(500).json({ message: 'Error with certificate', error: error.message });
  }
});

// Download certificate PDF
router.get('/:certificateId/download', certificateController.getCertificatePDF);

module.exports = router; 