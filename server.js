const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import configurations and middleware
const { connectDB } = require('./config/database');
const { requestLogger, apiLogger } = require('./middleware/logger');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const salesRoutes = require('./routes/salesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));

// Logging middleware
app.use(requestLogger);
app.use('/api/', apiLogger);

// Routes
app.use('/api/sales', salesRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const SalesData = require('./models/SalesData');
  
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const recordCount = await SalesData.countDocuments();
    
    res.json({
      success: true,
      status: 'healthy',
      database: dbStatus,
      recordCount: recordCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Basic HTML endpoint for testing
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Linq Sales API</title></head>
      <body>
        <h1>🎯 Linq Sales Data API</h1>
        <h2>Available Endpoints:</h2>
        <ul>
          <li><a href="/api/health">GET /api/health</a> - Health check</li>
          <li><a href="/api/sales">GET /api/sales</a> - Get sales data</li>
          <li><a href="/api/analytics">GET /api/analytics</a> - Get analytics</li>
          <li>POST /api/sales - Add new sales record</li>
        </ul>
        <h2>Query Parameters for /api/sales:</h2>
        <ul>
          <li>category - Filter by category</li>
          <li>region - Filter by region</li>
          <li>startDate - Filter from date (YYYY-MM-DD)</li>
          <li>endDate - Filter to date (YYYY-MM-DD)</li>
          <li>limit - Limit results (default: 100)</li>
        </ul>
      </body>
    </html>
  `);
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

// Start server
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = app; 