import PDFDocument from 'pdfkit';
import Certificate from '../models/certificate.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';

const certificateController = {
  generateCertificate: async (quizAttemptId) => {
    try {
      console.log('Starting certificate generation for quiz attempt:', quizAttemptId);
      
      const quizAttempt = await QuizAttempt.findById(quizAttemptId)
        .populate('user', 'username email');

      if (!quizAttempt) {
        console.log('Quiz attempt not found:', quizAttemptId);
        throw new Error('Quiz attempt not found');
      }

      console.log('Found quiz attempt:', {
        id: quizAttempt._id,
        user: quizAttempt.user._id,
        score: quizAttempt.totalScore
      });

      // Only generate certificate if score is above 50%
      if (quizAttempt.totalScore < 50) {
        console.log('Score below 50%, skipping certificate generation');
        return null;
      }

      // Check if certificate already exists
      let certificate = await Certificate.findOne({ quizAttempt: quizAttemptId });
      
      if (certificate) {
        console.log('Certificate already exists:', certificate);
        return certificate;
      }

      // Generate certificate number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const count = await Certificate.countDocuments();
      const sequence = String(count + 1).padStart(4, '0');
      const certificateNumber = `CERT-${year}${month}-${sequence}`;

      // Create new certificate
      certificate = new Certificate({
        user: quizAttempt.user._id,
        quizAttempt: quizAttempt._id,
        category: quizAttempt.category,
        score: quizAttempt.totalScore,
        certificateNumber
      });

      console.log('Saving new certificate:', certificate);
      await certificate.save();
      console.log('Certificate saved successfully:', certificate);

      return certificate;
    } catch (error) {
      console.error('Certificate generation error:', error);
      throw error;
    }
  },

  getCertificatePDF: async (req, res) => {
    try {
      const { certificateId } = req.params;
      console.log('Generating PDF for certificate:', certificateId);

      const certificate = await Certificate.findById(certificateId)
        .populate('user', 'username email')
        .populate('quizAttempt');

      if (!certificate) {
        console.log('Certificate not found:', certificateId);
        return res.status(404).json({ message: 'Certificate not found' });
      }

      console.log('Found certificate:', {
        id: certificate._id,
        user: certificate.user.username,
        category: certificate.category,
        score: certificate.score
      });

      // Create PDF document
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 50
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateNumber}.pdf`);

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');

      // Add border
      const borderWidth = 20;
      doc.rect(borderWidth, borderWidth, doc.page.width - (borderWidth * 2), doc.page.height - (borderWidth * 2))
         .lineWidth(2)
         .stroke('#1e40af');

      // Add certificate content
      doc.font('Helvetica-Bold')
         .fontSize(40)
         .fillColor('#1e40af')
         .text('Certificate of Achievement', { align: 'center', margin: 60 });

      doc.moveDown();
      doc.fontSize(20)
         .fillColor('#374151')
         .text('This is to certify that', { align: 'center' });

      doc.moveDown();
      doc.font('Helvetica-Bold')
         .fontSize(30)
         .fillColor('#1e40af')
         .text(certificate.user.username, { align: 'center' });

      doc.moveDown();
      doc.font('Helvetica')
         .fontSize(20)
         .fillColor('#374151')
         .text('has successfully completed the', { align: 'center' });

      doc.moveDown();
      doc.font('Helvetica-Bold')
         .fontSize(25)
         .fillColor('#1e40af')
         .text(`${certificate.category} Quiz`, { align: 'center' });

      doc.moveDown();
      doc.font('Helvetica')
         .fontSize(20)
         .fillColor('#374151')
         .text(`with a score of ${certificate.score.toFixed(1)}%`, { align: 'center' });

      // Add certificate details
      doc.moveDown(2);
      doc.fontSize(12)
         .text(`Certificate Number: ${certificate.certificateNumber}`, { align: 'center' });

      doc.moveDown();
      doc.text(`Issue Date: ${certificate.issueDate.toLocaleDateString()}`, { align: 'center' });

      // Add motivational message
      doc.moveDown(2);
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor('#059669')
         .text('Congratulations on your outstanding achievement!', { align: 'center' });

      // Add footer
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('This certificate is automatically generated and validates your successful completion of the quiz.', {
           align: 'center',
           bottom: 50
         });

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: 'Error generating certificate PDF', error: error.message });
    }
  },

  getUserCertificates: async (req, res) => {
    try {
      const userId = req.user._id;
      console.log('Fetching certificates for user:', userId);

      const certificates = await Certificate.find({ user: userId })
        .populate('quizAttempt')
        .sort('-createdAt');

      console.log('Found certificates:', certificates.length);
      res.json(certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ message: 'Error fetching certificates', error: error.message });
    }
  }
};

export default certificateController; 