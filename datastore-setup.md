# Datastore Setup

## Database Choice: MongoDB Atlas

I chose **MongoDB Atlas** as the database solution for this project. Here's why this was the best choice:

### Why MongoDB Atlas?

1. **Cloud-Hosted & Reliable**: No need to manage local database servers - MongoDB Atlas handles all the infrastructure
2. **Perfect for Node.js**: Native JSON support makes it seamless to work with JavaScript/Node.js applications
3. **Scalable**: Can easily handle growing data volumes without performance issues
4. **Real-time Ready**: Excellent support for real-time applications and change streams
5. **Free Tier**: MongoDB Atlas offers a generous free tier perfect for development and testing

### What I Built

The database setup includes:

- **MongoDB Atlas Cloud Database**: Hosted in the cloud with automatic backups
- **Mongoose ODM**: Object Document Mapper for easy database operations
- **Schema Validation**: Ensures data quality and consistency
- **Optimized Indexes**: Fast queries for analytics and real-time features
- **Connection Pooling**: Efficient database connections for high performance

## Database Schema

I designed a sales data schema that captures all the information needed for analytics:

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
    min: 0,
    max: 10000
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
  timestamps: true,  // Automatically adds createdAt and updatedAt
  collection: 'sales_data'
});
```

## Key Features I Implemented

### 1. **Data Validation**
- Category must be one of 8 predefined product categories
- Sales values must be positive and under $10,000
- Customer IDs follow a specific format (CUST_XXXXXX)
- Timestamps are automatically validated

### 2. **Performance Optimizations**
- **Compound Indexes**: Created indexes for common query patterns
- **Time-based Indexing**: Optimized for date range queries
- **Category Indexing**: Fast category-based analytics
- **Geographic Indexing**: Efficient regional analysis

### 3. **Advanced Features**
- **Virtual Fields**: Automatically calculated fields like formatted values
- **Static Methods**: Built-in functions for common queries
- **Instance Methods**: Helper methods for individual records
- **Middleware**: Pre/post save hooks for data processing

## How to Set Up the Database

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Setup Script**:
   ```bash
   node datastore_setup.js
   ```

3. **What Happens**:
   - Connects to MongoDB Atlas
   - Creates the sales_data collection
   - Sets up all indexes for optimal performance
   - Validates the schema works correctly
   - Confirms everything is ready for data ingestion

## Database Connection Details

- **Database**: `linq_assessment`
- **Collection**: `sales_data`
- **Connection**: MongoDB Atlas cloud cluster
- **Authentication**: Secure connection with username/password
- **SSL**: Encrypted connection for security

## Why This Setup Works Well

This MongoDB setup is perfect because:

- **Real-time Capabilities**: MongoDB change streams enable live dashboard updates
- **Analytics Ready**: Built-in aggregation pipeline for complex analytics
- **Scalable**: Can handle thousands of transactions per second
- **Developer Friendly**: Mongoose makes database operations intuitive
- **Production Ready**: Cloud-hosted with automatic backups and monitoring

