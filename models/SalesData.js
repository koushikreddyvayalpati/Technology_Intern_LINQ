const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Health & Beauty', 'Automotive', 'Toys'],
      message: 'Category must be one of the predefined values'
    },
    trim: true
  },
  value: {
    type: Number,
    required: [true, 'Value is required'],
    min: [0, 'Value must be positive'],
    max: [10000, 'Value cannot exceed $10,000'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Value must be greater than 0'
    }
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Timestamp cannot be in the future'
    }
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: {
      values: ['North', 'South', 'East', 'West', 'Central'],
      message: 'Region must be one of the predefined values'
    },
    trim: true
  },
  customer_id: {
    type: String,
    required: [true, 'Customer ID is required'],
    match: [/^CUST_\d{6}$/, 'Customer ID must follow format CUST_XXXXXX'],
    trim: true
  }
}, {
  timestamps: true,
  collection: 'sales_data',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal query performance
salesSchema.index({ timestamp: 1 });
salesSchema.index({ category: 1 });
salesSchema.index({ region: 1 });
salesSchema.index({ customer_id: 1 });
salesSchema.index({ timestamp: 1, category: 1 }); // Compound index for time-series queries
salesSchema.index({ region: 1, category: 1 }); // Regional category analysis

// Virtual for formatted value
salesSchema.virtual('formattedValue').get(function() {
  return `$${this.value.toFixed(2)}`;
});

// Virtual for date only (without time)
salesSchema.virtual('dateOnly').get(function() {
  return this.timestamp.toISOString().split('T')[0];
});

// Static methods for common queries
salesSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

salesSchema.statics.findByRegion = function(region) {
  return this.find({ region });
};

salesSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });
};

salesSchema.statics.getAnalytics = async function() {
  const analytics = await this.aggregate([
    {
      $facet: {
        totalStats: [
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
        ],
        categoryStats: [
          {
            $group: {
              _id: '$category',
              totalSales: { $sum: '$value' },
              count: { $sum: 1 },
              avgSale: { $avg: '$value' }
            }
          },
          { $sort: { totalSales: -1 } }
        ],
        regionStats: [
          {
            $group: {
              _id: '$region',
              totalSales: { $sum: '$value' },
              count: { $sum: 1 },
              avgSale: { $avg: '$value' }
            }
          },
          { $sort: { totalSales: -1 } }
        ]
      }
    }
  ]);
  
  return analytics[0];
};

// Instance methods
salesSchema.methods.isHighValue = function() {
  return this.value > 1000;
};

salesSchema.methods.getRegionalRank = async function() {
  const higherValueCount = await this.constructor.countDocuments({
    region: this.region,
    value: { $gt: this.value }
  });
  return higherValueCount + 1;
};

// Pre-save middleware
salesSchema.pre('save', function(next) {
  // Ensure customer_id is uppercase
  if (this.customer_id) {
    this.customer_id = this.customer_id.toUpperCase();
  }
  
  // Round value to 2 decimal places
  if (this.value) {
    this.value = Math.round(this.value * 100) / 100;
  }
  
  next();
});

// Post-save middleware for logging
salesSchema.post('save', function(doc) {
  console.log(`New sales record saved: ${doc.customer_id} - ${doc.formattedValue}`);
});

module.exports = mongoose.model('SalesData', salesSchema); 