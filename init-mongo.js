// MongoDB initialization script for Docker
db = db.getSiblingDB('linq_assessment');

// Create the sales_data collection
db.createCollection('sales_data');

// Create indexes for optimal performance
db.sales_data.createIndex({ timestamp: 1 });
db.sales_data.createIndex({ category: 1 });
db.sales_data.createIndex({ region: 1 });
db.sales_data.createIndex({ customer_id: 1 });
db.sales_data.createIndex({ timestamp: 1, category: 1 });
db.sales_data.createIndex({ region: 1, category: 1 });

print('Database initialized with indexes'); 