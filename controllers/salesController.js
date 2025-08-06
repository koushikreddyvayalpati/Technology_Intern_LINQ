const SalesData = require('../models/SalesData');
const { AppError } = require('../middleware/errorHandler');
const { dbLogger } = require('../middleware/logger');

// Helper function to build query filters
const buildQueryFilter = (queryParams) => {
  const { category, region, startDate, endDate, minValue, maxValue } = queryParams;
  let filter = {};

  if (category) filter.category = category;
  if (region) filter.region = region;
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  if (minValue || maxValue) {
    filter.value = {};
    if (minValue) filter.value.$gte = parseFloat(minValue);
    if (maxValue) filter.value.$lte = parseFloat(maxValue);
  }

  return filter;
};

// Helper function for pagination
const getPaginationOptions = (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 100;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

// @desc    Get all sales data with filtering and pagination
// @route   GET /api/sales
// @access  Public
const getAllSales = async (req, res) => {
  const filter = buildQueryFilter(req.query);
  const { page, limit, skip } = getPaginationOptions(req.query);
  const sort = req.query.sort || '-timestamp';

  dbLogger.logQuery('SalesData', 'find', filter);

  // Execute query with pagination
  const [sales, totalCount] = await Promise.all([
    SalesData.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    SalesData.countDocuments(filter)
  ]);

  dbLogger.logResult('SalesData', 'find', sales.length);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.json({
    success: true,
    data: sales,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage
    }
  });
};

// @desc    Get sales analytics
// @route   GET /api/sales/analytics
// @access  Public
const getAnalytics = async (req, res) => {
  dbLogger.logQuery('SalesData', 'analytics aggregation', {});

  const analytics = await SalesData.getAnalytics();
  
  // Additional time-based analytics
  const recentTrends = await SalesData.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        dailySales: { $sum: '$value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);

  dbLogger.logResult('SalesData', 'analytics', 1);

  res.json({
    success: true,
    data: {
      overview: analytics.totalStats[0] || {
        totalSales: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        minTransaction: 0,
        maxTransaction: 0
      },
      categoryBreakdown: analytics.categoryStats,
      regionBreakdown: analytics.regionStats,
      recentTrends
    }
  });
};

// @desc    Get sales summary
// @route   GET /api/sales/summary
// @access  Public
const getSalesSummary = async (req, res) => {
  const filter = buildQueryFilter(req.query);
  
  dbLogger.logQuery('SalesData', 'summary aggregation', filter);

  const summary = await SalesData.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$value' },
        totalTransactions: { $sum: 1 },
        avgTransaction: { $avg: '$value' },
        minTransaction: { $min: '$value' },
        maxTransaction: { $max: '$value' }
      }
    }
  ]);

  dbLogger.logResult('SalesData', 'summary', 1);

  res.json({
    success: true,
    data: summary[0] || {
      totalSales: 0,
      totalTransactions: 0,
      avgTransaction: 0,
      minTransaction: 0,
      maxTransaction: 0
    }
  });
};

// @desc    Get sales trends
// @route   GET /api/sales/trends
// @access  Public
const getSalesTrends = async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  
  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-W%U';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  const matchFilter = {};
  if (startDate || endDate) {
    matchFilter.timestamp = {};
    if (startDate) matchFilter.timestamp.$gte = new Date(startDate);
    if (endDate) matchFilter.timestamp.$lte = new Date(endDate);
  }

  dbLogger.logQuery('SalesData', 'trends aggregation', matchFilter);

  const trends = await SalesData.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: '$timestamp'
          }
        },
        sales: { $sum: '$value' },
        count: { $sum: 1 },
        avgSale: { $avg: '$value' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  dbLogger.logResult('SalesData', 'trends', trends.length);

  res.json({
    success: true,
    data: trends
  });
};

// @desc    Get single sales record
// @route   GET /api/sales/:id
// @access  Public
const getSalesById = async (req, res) => {
  const { id } = req.params;

  dbLogger.logQuery('SalesData', 'findById', { id });

  const sales = await SalesData.findById(id);

  if (!sales) {
    throw new AppError('Sales record not found', 404);
  }

  dbLogger.logResult('SalesData', 'findById', 1);

  res.json({
    success: true,
    data: sales
  });
};

// @desc    Create new sales record
// @route   POST /api/sales
// @access  Public
const createSales = async (req, res) => {
  dbLogger.logQuery('SalesData', 'create', req.body);

  const sales = await SalesData.create(req.body);

  dbLogger.logResult('SalesData', 'create', 1);

  res.status(201).json({
    success: true,
    data: sales
  });
};

// @desc    Create multiple sales records
// @route   POST /api/sales/bulk
// @access  Public
const createBulkSales = async (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    throw new AppError('Data must be a non-empty array', 400);
  }

  if (data.length > 1000) {
    throw new AppError('Cannot create more than 1000 records at once', 400);
  }

  dbLogger.logQuery('SalesData', 'insertMany', { count: data.length });

  const sales = await SalesData.insertMany(data, { ordered: false });

  dbLogger.logResult('SalesData', 'insertMany', sales.length);

  res.status(201).json({
    success: true,
    message: `Created ${sales.length} sales records`,
    data: sales
  });
};

// @desc    Update sales record
// @route   PUT /api/sales/:id
// @access  Public
const updateSales = async (req, res) => {
  const { id } = req.params;

  dbLogger.logQuery('SalesData', 'findByIdAndUpdate', { id });

  const sales = await SalesData.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!sales) {
    throw new AppError('Sales record not found', 404);
  }

  dbLogger.logResult('SalesData', 'findByIdAndUpdate', 1);

  res.json({
    success: true,
    data: sales
  });
};

// @desc    Delete sales record
// @route   DELETE /api/sales/:id
// @access  Public
const deleteSales = async (req, res) => {
  const { id } = req.params;

  dbLogger.logQuery('SalesData', 'findByIdAndDelete', { id });

  const sales = await SalesData.findByIdAndDelete(id);

  if (!sales) {
    throw new AppError('Sales record not found', 404);
  }

  dbLogger.logResult('SalesData', 'findByIdAndDelete', 1);

  res.json({
    success: true,
    message: 'Sales record deleted successfully'
  });
};

module.exports = {
  getAllSales,
  getAnalytics,
  getSalesSummary,
  getSalesTrends,
  getSalesById,
  createSales,
  createBulkSales,
  updateSales,
  deleteSales
}; 