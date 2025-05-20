const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const User = require('../models/user.model');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Get user profile
router.get('/profile/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Get Profile Request:', {
      requestedId: req.params.id,
      authenticatedUserId: req.user._id
    });

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to view their own profile
    if (user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile/:id', authMiddleware, upload.single('profilePic'), async (req, res) => {
  try {
    console.log('Update Profile Request:', {
      requestedId: req.params.id,
      authenticatedUserId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Only allow users to update their own profile
    if (req.params.id !== req.user._id.toString() && !req.user.isAdmin) {
      console.log('Authorization failed:', {
        requestedId: req.params.id,
        authenticatedUserId: req.user._id,
        match: req.params.id === req.user._id.toString()
      });
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const updateData = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      department: req.body.department,
      semester: req.body.semester
    };

    // If a new profile picture was uploaded
    if (req.file) {
      try {
        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'quiz-portal/profiles',
          resource_type: 'auto'
        });

        // Delete old image from Cloudinary if it exists
        const user = await User.findById(req.params.id);
        if (user.profilePicUrl) {
          const oldPublicId = user.profilePicUrl.split('/').pop().split('.')[0];
          if (oldPublicId) {
            await cloudinary.uploader.destroy(`quiz-portal/profiles/${oldPublicId}`);
          }
        }

        // Update with new Cloudinary URL
        updateData.profilePicUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ message: 'Error uploading profile picture' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully:', {
      userId: updatedUser._id,
      updates: updateData
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router; 