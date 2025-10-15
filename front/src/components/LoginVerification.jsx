import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../utils/api';

const LoginVerification = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get user data from location state
    const data = location.state?.userData;

    if (!data) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setUserData(data);
  }, [location, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleVerifyLogin = async (e) => {
    e.preventDefault();

    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/verify-login', {
        email: userData.email,
        token: code
      });

      if (response.data.success) {
        toast.success('Login successful!');

        // Store user data and redirect to home
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Force page reload to update auth state
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
      const response = await API.post('/auth/resend-login-otp', {
        email: userData.email
      });

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
          Verify Your Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent a 6-digit code to {userData?.email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleVerifyLogin}>
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
                {loading ? 'Verifying...' : 'Verify & Login'}
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

export default LoginVerification;