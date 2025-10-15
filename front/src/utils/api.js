import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.MODE === 'production'
        ? 'https://guardian-gate-jwt-auth-otp-flow.onrender.com/api'
        : 'http://localhost:5000/api',
    withCredentials: true
});

// Add token to requests
API.interceptors.request.use((config) => {
    return config;
});

// Handle token refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Don't redirect for auth/me endpoint - let the AuthContext handle it
        if (error.response?.status === 401 && !error.config.url.includes('/auth/me')) {
            // Check if it's a verification error
            if (error.response?.data?.message?.includes('verify your email')) {
                // Store email for verification
                const email = error.config.data ? JSON.parse(error.config.data).email : null;
                if (email) {
                    localStorage.setItem('pendingVerification', JSON.stringify({ email }));
                    window.location.href = '/verify-email';
                    return Promise.reject(error);
                }
            }

            // Token expired - clear local storage and redirect to login
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;