const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const sendToken = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    res.cookie('token', token, cookieOptions);

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        }
    });
};

// Helper function to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        // Generate and send verification token
        const verificationToken = generateOTP(); // Use the new function
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 2 * 60 * 1000; // 02 minutes
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, name, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email for verification code.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await User.findOne({
            email,
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        // Mark user as verified and clear token
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);

        sendToken(user, 200, res);

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Resend Verification Code for Registration
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = generateOTP(); // Use the new function
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 2 * 60 * 1000; // 02 minutes
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, user.name, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification code sent successfully!'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Send OTP for login
router.post('/send-login-otp', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email. Please register first.'
            });
        }

        // Check password
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email address first. Check your inbox for the verification code.'
            });
        }

        // Generate and send verification token for login
        const verificationToken = generateOTP(); // Use the new function
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 2 * 60 * 1000; // 02 minutes
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, user.name, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Send login OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Resend OTP for login
router.post('/resend-login-otp', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new verification token (this will expire the old one)
        const verificationToken = generateOTP(); // Use the new function
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 2 * 60 * 1000; // 02 minutes
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, user.name, verificationToken);

        res.status(200).json({
            success: true,
            message: 'New verification code sent successfully!'
        });

    } catch (error) {
        console.error('Resend login OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Verify login OTP
router.post('/verify-login', async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await User.findOne({
            email,
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        // Clear verification token
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        sendToken(user, 200, res);

    } catch (error) {
        console.error('Login verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        // Generate reset token (6-digit OTP)
        const resetToken = generateOTP(); // Use the new function
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(email, user.name, resetToken);

        res.status(200).json({
            success: true,
            message: 'Password reset code sent to your email'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Verify Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset code'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const user = await User.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset code'
            });
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Change Password (requires authentication)
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        // Verify current password
        const isPasswordCorrect = await user.correctPassword(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete Account
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Verify credentials
        if (user.email !== email) {
            return res.status(401).json({
                success: false,
                message: 'Email does not match'
            });
        }

        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }

        // Delete user
        await User.findByIdAndDelete(req.user.id);

        // Clear cookie
        res.cookie('token', 'none', {
            expires: new Date(Date.now()),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                isVerified: req.user.isVerified,
                createdAt: req.user.createdAt  // ADD THIS LINE
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;