const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            securityQuestion,
            securityAnswer: securityAnswer.trim().toLowerCase() // Normalize answer for easier recovery
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
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

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`[Forgot Password] Request received for email: "${email}"`);

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.trim() });
        console.log(`[Forgot Password] User found: ${!!user}`);

        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist' });
        }

        // Generate reset token
        const resetToken = require('crypto').randomBytes(20).toString('hex');

        // Set token properties on user
        user.resetToken = resetToken;
        user.resetTokenExpire = Date.now() + 3600000; // 1 hour from now

        await user.save();

        // In a real app, you'd send an email here.
        // For development, we'll log it and return it in the response for visibility.
        console.log('-----------------------------------------');
        console.log(`PASSWORD RESET REQUEST FOR: ${email}`);
        console.log(`RESET TOKEN: ${resetToken}`);
        console.log('-----------------------------------------');

        res.json({
            message: 'Password reset token generated. Check server logs.',
            token: resetToken // Returning token for easy testing/demo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during forgot password' });
    }
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Please provide token and new password' });
        }

        const user = await User.findOneByToken(token);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token has expired
        if (user.resetTokenExpire < Date.now()) {
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token fields
        user.resetToken = null;
        user.resetTokenExpire = null;

        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during password reset' });
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

        // Clear any active reset tokens as well
        user.resetToken = null;
        user.resetTokenExpire = null;

        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
