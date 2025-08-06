const mongoose = require('mongoose');

const config = {
  url: process.env.MONGODB_URL || 'mongodb+srv://koushik1314:Kalyani713@linqbackend.o0g46ue.mongodb.net/linq_assessment?retryWrites=true&w=majority&appName=Linqbackend',
  options: {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 5,
    bufferCommands: false
  }
};

const connectDB = async () => {
  try {
    console.log('Connecting to the MongoDb server');
    await mongoose.connect(config.url, config.options);
    console.log('MongoDb connected successfully');
  } catch (error) {
    console.error('MongoDb connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

module.exports = {
  connectDB,
  disconnectDB,
  config
}; 