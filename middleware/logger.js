const morgan = require('morgan');

// Custom token for response time with color coding
morgan.token('response-time-colored', (req, res) => {
  const responseTime = parseFloat(morgan['response-time'](req, res));
  if (responseTime < 100) return `\x1b[32m${responseTime}ms\x1b[0m`; // Green
  if (responseTime < 500) return `\x1b[33m${responseTime}ms\x1b[0m`; // Yellow
  return `\x1b[31m${responseTime}ms\x1b[0m`; // Red
});

// Custom token for status code with color coding
morgan.token('status-colored', (req, res) => {
  const status = res.statusCode;
  if (status < 300) return `\x1b[32m${status}\x1b[0m`; // Green
  if (status < 400) return `\x1b[36m${status}\x1b[0m`; // Cyan
  if (status < 500) return `\x1b[33m${status}\x1b[0m`; // Yellow
  return `\x1b[31m${status}\x1b[0m`; // Red
});

// Custom token for method with color coding
morgan.token('method-colored', (req, res) => {
  const method = req.method;
  switch (method) {
    case 'GET': return `\x1b[32m${method}\x1b[0m`;    // Green
    case 'POST': return `\x1b[33m${method}\x1b[0m`;   // Yellow
    case 'PUT': return `\x1b[34m${method}\x1b[0m`;    // Blue
    case 'DELETE': return `\x1b[31m${method}\x1b[0m`; // Red
    default: return `\x1b[37m${method}\x1b[0m`;       // White
  }
});

// Development logger format
const devFormat = ':method-colored :url :status-colored :response-time-colored - :res[content-length]';

// Production logger format
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Request logger middleware
const requestLogger = process.env.NODE_ENV === 'production' 
  ? morgan(prodFormat)
  : morgan(devFormat);

// API access logger
const apiLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`Query params:`, req.query);
  }
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields if any
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    console.log(`Request body:`, sanitizedBody);
  }
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.log(`Error response:`, data);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Database operation logger
const dbLogger = {
  logQuery: (model, operation, filter = {}) => {
    console.log(`DB ${operation} on ${model} - Filter:`, filter);
  },
  
  logResult: (model, operation, count) => {
    console.log(`DB ${operation} on ${model} - Results: ${count}`);
  },
  
  logError: (model, operation, error) => {
    console.log(`DB ${operation} on ${model} - Error:`, error.message);
  }
};

module.exports = {
  requestLogger,
  apiLogger,
  dbLogger
}; 