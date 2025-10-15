import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear errors when user starts typing
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await API.post('/auth/send-login-otp', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                toast.success('Verification code sent to your email!');

                // Navigate to login verification with user data
                navigate('/login-verification', {
                    state: {
                        userData: response.data.user
                    }
                });
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';

            // Handle specific error cases
            if (error.response?.status === 401) {
                if (message.includes('Invalid email or password')) {
                    setErrors({
                        general: 'Invalid email or password. Please check your credentials.'
                    });
                } else if (message.includes('verify your email')) {
                    setErrors({
                        general: 'Please verify your email address first. Check your inbox for the verification code.'
                    });
                } else {
                    setErrors({ general: message });
                }
            } else if (error.response?.status === 404) {
                setErrors({
                    general: 'No account found with this email. Please register first.'
                });
            } else {
                setErrors({ general: message });
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link
                        to="/register"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Error Message */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
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
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Sending OTP...' : 'Send Verification Code'}
                            </button>
                        </div>
                        {/* Add this inside the form, after the submit button */}
                        <div className="text-center mt-4">
                            <Link
                                to="/forgot-password"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        {/* Help Text */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;