import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { normalizeMongoUri } from './config/database.js';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', normalizeMongoUri(process.env.MONGODB_URI || 'mongodb+srv://kapuriyapurvj:ETLfKOTDmTFrLxpa@cluster0.on3xg.mongodb.net/SmartPrep'));
    
    const conn = await mongoose.connect(normalizeMongoUri(process.env.MONGODB_URI || 'mongodb+srv://kapuriyapurvj:ETLfKOTDmTFrLxpa@cluster0.on3xg.mongodb.net/SmartPrep'));
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
