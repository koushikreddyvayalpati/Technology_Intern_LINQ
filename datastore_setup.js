const { connectDB, disconnectDB } = require('./config/database');
const SalesData = require('./models/SalesData');

async function setupDatabase() {
  try {
    console.log('🔌 Setting up MongoDB database...');
    
    await connectDB();
    
    // Drop existing collection for clean setup
    try {
      await SalesData.collection.drop();
      console.log('🗑️  Existing collection dropped');
    } catch (error) {
      // Collection doesn't exist, continue
      console.log('📝 Creating new collection...');
    }
    
    // Create collection with schema validation
    await SalesData.createCollection();
    
    // Ensure indexes are created
    await SalesData.createIndexes();
    
    console.log('✅ Database setup completed successfully');
    console.log(`📊 Database: linq_assessment`);
    console.log(`📋 Collection: sales_data`);
    console.log('🔍 Indexes created with Mongoose schema');
    console.log('📝 Schema validation enabled');
    
    // Test schema validation
    console.log('🧪 Testing schema validation...');
    const testDoc = new SalesData({
      category: 'Electronics',
      value: 99.99,
      timestamp: new Date(),
      region: 'North',
      customer_id: 'CUST_123456'
    });
    
    const validationError = testDoc.validateSync();
    if (!validationError) {
      console.log('✅ Schema validation test passed');
    } else {
      console.log('❌ Schema validation test failed:', validationError.message);
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 