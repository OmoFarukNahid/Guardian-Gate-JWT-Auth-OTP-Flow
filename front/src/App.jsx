import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Loading from './components/Loading';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import LoginVerification from './components/LoginVerification';
import Home from './pages/Home';
import ForgotPassword from './components/ForgotPassword';
import ChangePassword from './components/ChangePassword';
import DeleteAccount from './components/DeleteAccount';

// Move these components INSIDE the App function so they have access to AuthProvider
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    return !user ? children : <Navigate to="/" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                        }}
                    />
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/verify-email"
                            element={<VerifyEmail />}
                        />
                        <Route
                            path="/login-verification"
                            element={<LoginVerification />}
                        />
                        <Route
                            path="/forgot-password"
                            element={<ForgotPassword />}
                        />
                        <Route
                            path="/change-password"
                            element={
                                <ProtectedRoute>
                                    <ChangePassword />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/delete-account"
                            element={
                                <ProtectedRoute>
                                    <DeleteAccount />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;