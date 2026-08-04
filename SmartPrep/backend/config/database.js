import mongoose from 'mongoose';

const DEFAULT_DB_NAME = process.env.MONGO_DB_NAME || 'SmartPrep';

export const normalizeMongoUri = (rawMongoUri) => {
  const trimmedUri = rawMongoUri?.trim();

  if (!trimmedUri) {
    return `mongodb://localhost:27017/${DEFAULT_DB_NAME}`;
  }

  const uriWithScheme = /^(mongodb(?:\+srv)?:\/\/)/.test(trimmedUri)
    ? trimmedUri
    : `mongodb://${trimmedUri}`;

  try {
    const parsedUri = new URL(uriWithScheme);

    if (!parsedUri.pathname || parsedUri.pathname === '/') {
      parsedUri.pathname = `/${DEFAULT_DB_NAME}`;
    }

    return parsedUri.toString();
  } catch {
    return uriWithScheme;
  }
};

const connectDB = async () => {
  try {
    mongoose.set('bufferCommands', false);

    const mongoUri = normalizeMongoUri(process.env.MONGODB_URI);

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 100),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
      heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_FREQUENCY_MS || 10000)
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
