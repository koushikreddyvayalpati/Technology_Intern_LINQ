const { body, query, validationResult } = require('express-validator');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Sales data validation rules
const validateSalesData = [
  body('category')
    .isIn(['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Health & Beauty', 'Automotive', 'Toys'])
    .withMessage('Category must be one of the predefined values'),
  
  body('value')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Value must be between $0.01 and $10,000'),
  
  body('region')
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Region must be one of the predefined values'),
  
  body('customer_id')
    .matches(/^CUST_\d{6}$/)
    .withMessage('Customer ID must follow format CUST_XXXXXX'),
  
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

// Query parameter validation for sales endpoint
const validateSalesQuery = [
  query('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Health & Beauty', 'Automotive', 'Toys'])
    .withMessage('Invalid category'),
  
  query('region')
    .optional()
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Invalid region'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  handleValidationErrors
];

// Date range validation
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date'
      });
    }
    
    // Check if date range is not too large (max 1 year)
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (end - start > maxRange) {
      return res.status(400).json({
        success: false,
        error: 'Date range cannot exceed 1 year'
      });
    }
  }
  
  next();
};

module.exports = {
  validateSalesData,
  validateSalesQuery,
  validateDateRange,
  handleValidationErrors
}; 