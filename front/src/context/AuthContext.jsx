import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);
    // In the checkAuth function, add verification status check
    const checkAuth = async () => {
        const startTime = Date.now();

        try {
            const response = await API.get('/auth/me');

            if (response.data.success) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            // 401 is expected when no user is logged in - don't treat it as an error
            if (error.response?.status !== 401) {
                console.error('Auth check error:', error);
            }
            setUser(null);
            localStorage.removeItem('user');
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1500 - elapsedTime);

            if (remainingTime > 0) {
                setTimeout(() => {
                    setLoading(false);
                }, remainingTime);
            } else {
                setLoading(false);
            }
        }
    };

    const login = async (email, password) => {
        try {
            const response = await API.post('/auth/login', { email, password });
            if (response.data.success) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                toast.success('Login successful!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await API.post('/auth/register', userData);
            if (response.data.success) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                toast.success('Registration successful!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            toast.success('Logged out successfully!');
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};