import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../utils/api';

const VerifyEmail = () => {
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [countdown, setCountdown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get email from location state or localStorage
        const userEmail = location.state?.email || JSON.parse(localStorage.getItem('pendingVerification'))?.email;

        if (!userEmail) {
            toast.error('No email found for verification');
            navigate('/register');
            return;
        }

        setEmail(userEmail);

        // Store email in localStorage for persistence
        localStorage.setItem('pendingVerification', JSON.stringify({ email: userEmail }));
    }, [location, navigate]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleCodeChange = (index, value) => {
        if (!/^\d?$/.test(value)) return; // Only allow numbers

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`code-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            document.getElementById(`code-${index - 1}`).focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pasteData)) {
            const newCode = pasteData.split('').concat(Array(6 - pasteData.length).fill(''));
            setVerificationCode(newCode);
            document.getElementById(`code-${Math.min(pasteData.length, 5)}`).focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        const code = verificationCode.join('');
        if (code.length !== 6) {
            toast.error('Please enter the 6-digit verification code');
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/auth/verify-email', {
                email,
                token: code
            });

            if (response.data.success) {
                toast.success('Email verified successfully!');
                localStorage.removeItem('pendingVerification');

                // Store user data and redirect to home
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Force redirect to home page
                window.location.href = '/';
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Verification failed';
            toast.error(message);

            // Clear code on error
            setVerificationCode(['', '', '', '', '', '']);
            document.getElementById('code-0').focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        try {
            const response = await API.post('/auth/resend-verification', { email });

            if (response.data.success) {
                toast.success('New verification code sent successfully!');
                setCountdown(60);

                // Clear the current code input
                setVerificationCode(['', '', '', '', '', '']);
                document.getElementById('code-0').focus();
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to resend code';
            toast.error(message);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Verify Your Email
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    We sent a 6-digit code to {email}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleVerify}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                Enter verification code
                            </label>
                            <div className="flex justify-between space-x-2">
                                {verificationCode.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`code-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendLoading || countdown > 0}
                                className="text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {resendLoading ? 'Sending...' :
                                    countdown > 0 ? `Resend code in ${countdown}s` :
                                        "Didn't receive code? Resend"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;