require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mlService = require('./services/mlService');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - move to top
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Security & Middleware
app.use(helmet()); // Set security headers
app.use(express.json()); // Parse JSON bodies

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', require('./routes/auth'));

// Health Check
app.get('/health', (req, res) => {
    res.send('Server is running.');
});

// Start Server & Train Model
const startServer = async () => {
    try {
        // Connect to Database
        const connectDB = require('./config/db');
        await connectDB();

        // Train ML Model on startup
        await mlService.trainModel();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
