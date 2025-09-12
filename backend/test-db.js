import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/smartprep');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartprep');
    console.log('✅ MongoDB Connected successfully!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.log('\n🔧 Solutions:');
    console.log('1. Make sure MongoDB is running locally');
    console.log('2. Or use MongoDB Atlas (cloud)');
    console.log('3. Check your .env file has correct MONGODB_URI');
    process.exit(1);
  }
};

testConnection();
