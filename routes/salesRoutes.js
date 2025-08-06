const express = require('express');
const salesController = require('../controllers/salesController');
const { validateSalesData, validateSalesQuery, validateDateRange } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/sales - Get all sales data with filtering and pagination
router.get('/', 
  validateSalesQuery,
  validateDateRange,
  catchAsync(salesController.getAllSales)
);

// GET /api/sales/analytics - Get sales analytics
router.get('/analytics', 
  catchAsync(salesController.getAnalytics)
);

// GET /api/sales/summary - Get sales summary
router.get('/summary',
  validateSalesQuery,
  validateDateRange,
  catchAsync(salesController.getSalesSummary)
);

// GET /api/sales/trends - Get sales trends
router.get('/trends',
  validateDateRange,
  catchAsync(salesController.getSalesTrends)
);

// GET /api/sales/:id - Get single sales record
router.get('/:id',
  catchAsync(salesController.getSalesById)
);

// POST /api/sales - Create new sales record
router.post('/',
  validateSalesData,
  catchAsync(salesController.createSales)
);

// POST /api/sales/bulk - Create multiple sales records
router.post('/bulk',
  catchAsync(salesController.createBulkSales)
);

// PUT /api/sales/:id - Update sales record
router.put('/:id',
  validateSalesData,
  catchAsync(salesController.updateSales)
);

// DELETE /api/sales/:id - Delete sales record
router.delete('/:id',
  catchAsync(salesController.deleteSales)
);

module.exports = router; 