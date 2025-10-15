import React, { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { toast } from 'react-hot-toast';

const DeleteAccount = () => {
    const [step, setStep] = useState(1); // 1: credentials, 2: OTP, 3: confirmation
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        token: ''
    });
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [countdown, setCountdown] = useState(0);

    const { user, logout } = useAuth();
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

    const handleVerifyCredentials = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setErrors({ general: 'Please enter both email and password' });
            return;
        }

        if (formData.email !== user.email) {
            setErrors({ email: 'Email does not match your account' });
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/auth/send-login-otp', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                toast.success('Verification code sent to your email!');
                setStep(2);
                setCountdown(60); // Start countdown for resend
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid credentials';
            if (error.response?.status === 401) {
                setErrors({ general: 'Invalid email or password' });
            } else {
                setErrors({ general: message });
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            const response = await API.post('/auth/resend-login-otp', {
                email: formData.email
            });

            if (response.data.success) {
                toast.success('New verification code sent!');
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

        setStep(3);
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            const response = await API.delete('/auth/delete-account', {
                data: {
                    email: formData.email,
                    password: formData.password
                }
            });

            if (response.data.success) {
                toast.success('Account deleted successfully!');
                await logout();
                navigate('/login');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete account';
            toast.error(message);
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                            Delete Account
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            This action cannot be undone. All your data will be permanently deleted.
                        </p>

                        {/* Step 1: Verify Credentials */}
                        {step === 1 && (
                            <form onSubmit={handleVerifyCredentials} className="space-y-4">
                                {errors.general && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-600">{errors.general}</p>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
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
                                            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>

                                    <div className="mt-1 relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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

                                    {/* Forgot Password Link */}
                                    <div className="text-right mt-2">
                                        <Link 
                                            to="/forgot-password" 
                                            className="text-sm text-indigo-600 hover:text-indigo-500"
                                        >
                                            Forgot your password?
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Sending OTP...' : 'Verify & Continue'}
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

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Verify & Continue
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Final Confirmation */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                Final Warning
                                            </h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>
                                                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={loading}
                                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccount;