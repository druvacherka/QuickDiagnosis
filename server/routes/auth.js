const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_development', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, securityQuestion, securityAnswer } = req.body;

        if (!name || !email || !password || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ message: 'Please add all fields including security question' });
        }

        // Check user existence
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            securityQuestion,
            securityAnswer: securityAnswer.trim().toLowerCase(), // Normalize answer for easier recovery
            verificationToken,
            tokenExpiry: Date.now() + 15 * 60 * 1000 // 15 minutes
        });

        if (user) {
            // Send verification email
            // Use environment variable for frontend URL, default to localhost:5173
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const verifyUrl = `${frontendUrl}/verify/${verificationToken}`;

            const message = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #0e8af8;">QuickDiagnosis</h1>
                    <h2>Email Verification</h2>
                    <p>Hello ${user.name},</p>
                    <p>Thank you for registering. Please click the button below to verify your email address. This link will expire in 15 minutes.</p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;" clicktracking=off>Verify Email</a>
                </div>
            `;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'QuickDiagnosis - Verify Your Email',
                    html: message
                });
                res.status(201).json({
                    message: 'Registration successful. Please check your email to verify your account.'
                });
            } catch (err) {
                // If the email fails to dispatch, rollback the user creation entirely
                // This prevents ghost users from getting stuck in an unverified state
                await User.deleteOne({ _id: user._id });
                console.error('Email could not be sent', err);
                res.status(500).json({ message: 'Email could not be sent. Please contact support.', debug: err.message });
            }
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

// @desc    Verify email token
// @route   GET /api/auth/verify/:token
// @access  Public
router.get('/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
            tokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.tokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = verificationToken;
        user.tokenExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify/${verificationToken}`;

        const message = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #0e8af8;">QuickDiagnosis</h1>
                <h2>Email Verification</h2>
                <p>Hello ${user.name},</p>
                <p>Please click the button below to verify your email address. This link will expire in 15 minutes.</p>
                <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;" clicktracking=off>Verify Email</a>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'QuickDiagnosis - Verify Your Email',
            html: message
        });

        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
