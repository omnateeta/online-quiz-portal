const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Generate unique certificate number
certificateSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const count = await mongoose.model('Certificate').countDocuments();
      const sequence = String(count + 1).padStart(4, '0');
      this.certificateNumber = `CERT-${year}${month}-${sequence}`;
      console.log('Generated certificate number:', this.certificateNumber);
    } catch (error) {
      console.error('Error generating certificate number:', error);
      return next(error);
    }
  }
  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate; 