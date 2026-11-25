import mongoose from 'mongoose';

let isMongooseConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    isMongooseConnected = false;
    console.warn('[Database] MONGO_URI is not set. Operating in persistent local store mode.');
    return false;
  }

  try {
    // Give remote Atlas clusters more time on cold start while keeping local fallback fast
    const isRemote = mongoURI.startsWith('mongodb+srv://');
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: isRemote ? 10000 : 3000,
    });

    isMongooseConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isMongooseConnected = false;
    console.warn(`[Database] MongoDB connection was not reachable (${error.message}).`);
    console.log(`[Database] Operating in persistent local store mode for zero-config execution. To connect to MongoDB Atlas, add your MONGO_URI in server/.env.`);
    return false;
  }
};

export const getIsMongooseConnected = () =>
  isMongooseConnected && mongoose.connection.readyState === 1;
