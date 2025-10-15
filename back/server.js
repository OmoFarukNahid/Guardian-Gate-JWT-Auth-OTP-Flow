const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : 'http://localhost:5173',
    credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true,
        message: 'API Server is running!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.status(200).json({ 
        success: true,
        message: 'API is working!'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to JWT Auth API'
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    res.status(500).json({
        success: false,
        message: 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});