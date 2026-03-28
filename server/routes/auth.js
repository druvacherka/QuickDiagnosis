const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { protect } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_development', {
        expiresIn: '30d',
    });
};

// @desc    Send OTP for email verification (Step 1)
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await Otp.findOneAndUpdate(
            { email },
            { otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        const message = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h1 style="color: #0e8af8; text-align: center;">QuickDiagnosis</h1>
                <h2 style="color: #334155; text-align: center;">Email Verification Code</h2>
                <p style="color: #475569; font-size: 16px;">Hello ${name || 'User'},</p>
                <p style="color: #475569; font-size: 16px;">Thank you for starting your registration. Please use the verification code below to proceed. This code expires in 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; padding: 15px 30px; background-color: #f1f5f9; color: #0f172a; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; border: 2px dashed #cbd5e1;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
        `;

        await sendEmail({
            email,
            subject: 'QuickDiagnosis - Verify Your Email',
            html: message
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// @desc    Verify OTP and return auth token for registration (Step 2)
// @route   POST /api/auth/verify-otp-initial
// @access  Public
router.post('/verify-otp-initial', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET || 'fallback_secret_for_development', { expiresIn: '30m' });
        await Otp.deleteOne({ email });

        res.json({ message: 'Email verified successfully', verificationToken });
    } catch (error) {
        console.error('Verify OTP Initial Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Register new user (Final Step)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, securityQuestion, securityAnswer, age, gender, history, verificationToken } = req.body;

        if (!name || !email || !password || !securityQuestion || !securityAnswer || !verificationToken) {
            return res.status(400).json({ message: 'Please provide all details and verification token' });
        }

        try {
            const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'fallback_secret_for_development');
            if (decoded.email !== email) {
                return res.status(400).json({ message: 'Token email mismatch' });
            }
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired verification token. Please restart registration.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            securityQuestion,
            securityAnswer: securityAnswer.trim().toLowerCase(),
            age,
            gender,
            history,
            isVerified: true
        });

        if (user) {
            res.status(201).json({
                message: 'Registration successful! You can now log in.'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.toString(), stack: error.stack });
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.isVerified) {
                return res.status(403).json({ message: 'Please verify your email before logging in' });
            }
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                gender: user.gender,
                history: user.history,
                weight: user.weight,
                height: user.height,
                bloodGroup: user.bloodGroup,
                medicalHistory: user.medicalHistory,
                allergies: user.allergies,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user security question
// @route   POST /api/auth/get-security-question
// @access  Public
router.post('/get-security-question', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.trim() });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.securityQuestion) {
            return res.status(400).json({ message: 'No security question set for this account' });
        }

        res.json({ question: user.securityQuestion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Reset password using security answer
// @route   POST /api/auth/reset-with-answer
// @access  Public
router.post('/reset-with-answer', async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;

        if (!email || !answer || !newPassword) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const user = await User.findOne({ email: email.trim() });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const normalizedInput = answer.trim().toLowerCase();
        if (user.securityAnswer !== normalizedInput) {
            return res.status(400).json({ message: 'Incorrect answer to security question' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.age = req.body.age !== undefined && req.body.age !== '' ? Number(req.body.age) : user.age;
            user.gender = req.body.gender || user.gender;
            user.weight = req.body.weight !== undefined && req.body.weight !== '' ? Number(req.body.weight) : user.weight;
            user.height = req.body.height !== undefined && req.body.height !== '' ? Number(req.body.height) : user.height;
            user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
            user.medicalHistory = req.body.medicalHistory || user.medicalHistory;
            user.allergies = req.body.allergies || user.allergies;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                age: updatedUser.age,
                gender: updatedUser.gender,
                history: updatedUser.history,
                weight: updatedUser.weight,
                height: updatedUser.height,
                bloodGroup: updatedUser.bloodGroup,
                medicalHistory: updatedUser.medicalHistory,
                allergies: updatedUser.allergies,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
