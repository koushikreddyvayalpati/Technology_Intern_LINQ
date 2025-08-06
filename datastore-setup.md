# Datastore Setup

## Choice: MongoDB

**Why MongoDB?**

MongoDB was selected for this project based on these key factors:

1. **Flexible Schema**: Perfect for evolving data structures without migrations
2. **JSON-Native**: Seamless integration with Node.js applications  
3. **Horizontal Scaling**: Built-in sharding for future growth
4. **Rich Querying**: Powerful aggregation pipeline for analytics
5. **Time-Series Support**: Excellent for timestamp-based data analysis

## Setup Process

The `datastore_setup.js` script uses Mongoose and handles:

- Mongoose connection with connection pooling
- Schema definition with built-in validation
- Automatic index creation
- Error handling for connection failures
- Environment-specific configuration

## Schema Design

```javascript
const salesSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Health & Beauty', 'Automotive', 'Toys']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  region: {
    type: String,
    required: true,
    enum: ['North', 'South', 'East', 'West', 'Central']
  },
  customer_id: {
    type: String,
    required: true,
    match: /^CUST_\d{6}$/
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt
  collection: 'sales_data'
});
```

## Indexes

- `timestamp`: For time-based queries
- `category`: For category-based aggregations
- `region`: For geographic analysis
- `customer_id`: For customer lookup
- `timestamp + category`: Compound index for time-series analytics

## Benefits of Mongoose

- **Built-in Validation**: Automatic data validation before saving
- **Schema Evolution**: Easy to modify and version schemas
- **Middleware Support**: Pre/post hooks for data processing
- **Connection Pooling**: Automatic connection management
- **Query Builder**: Intuitive query interface

This setup ensures optimal query performance and data integrity for our visualization needs. 