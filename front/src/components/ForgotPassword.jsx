import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: verify, 3: reset
    const [formData, setFormData] = useState({
        email: '',
        token: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [countdown, setCountdown] = useState(0);

    const navigate = useNavigate();

    // Countdown timer
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateEmail = () => {
        if (!formData.email) {
            setErrors({ email: 'Email is required' });
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setErrors({ email: 'Email is invalid' });
            return false;
        }
        return true;
    };

    const validatePassword = () => {
        const newErrors = {};
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!validateEmail()) return;

        setLoading(true);
        try {
            const response = await API.post('/auth/forgot-password', {
                email: formData.email
            });

            if (response.data.success) {
                toast.success('Reset code sent to your email!');
                setStep(2);
                setCountdown(60); // Start countdown for resend
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send reset code';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            const response = await API.post('/auth/forgot-password', {
                email: formData.email
            });

            if (response.data.success) {
                toast.success('New reset code sent!');
                setCountdown(60);
                setFormData({ ...formData, token: '' });
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to resend code';
            toast.error(message);
        } finally {
            setResendLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!formData.token || formData.token.length !== 6) {
            toast.error('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/auth/verify-reset-otp', {
                email: formData.email,
                token: formData.token
            });

            if (response.data.success) {
                toast.success('Code verified successfully!');
                setStep(3);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid verification code';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;

        setLoading(true);
        try {
            const response = await API.post('/auth/reset-password', {
                email: formData.email,
                token: formData.token,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });

            if (response.data.success) {
                toast.success('Password reset successfully!');
                navigate('/login');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {step === 1 && 'Reset Your Password'}
                    {step === 2 && 'Verify Your Identity'}
                    {step === 3 && 'Create New Password'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        back to login
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.email ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Enter the 6-digit code sent to {formData.email}
                                </label>
                                <div className="flex justify-between space-x-2">
                                    {[...Array(6)].map((_, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength="1"
                                            value={formData.token[index] || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!/^\d?$/.test(value)) return;
                                                
                                                const newToken = formData.token.split('');
                                                newToken[index] = value;
                                                setFormData({
                                                    ...formData,
                                                    token: newToken.join('')
                                                });

                                                if (value && index < 5) {
                                                    document.getElementById(`otp-${index + 1}`).focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !formData.token[index] && index > 0) {
                                                    document.getElementById(`otp-${index - 1}`).focus();
                                                }
                                            }}
                                            id={`otp-${index}`}
                                            className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>

                                {/* Resend OTP Button */}
                                <div className="text-center pt-4">
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={resendLoading || countdown > 0}
                                        className="text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                                    >
                                        {resendLoading ? 'Sending...' : 
                                         countdown > 0 ? `Resend code in ${countdown}s` : 
                                         "Didn't receive code? Resend"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.password ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm New Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;