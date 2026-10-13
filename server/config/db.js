import mongoose from 'mongoose';

let isMongooseConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  try {
    // Attempt Mongoose connection with 3-second timeout so it doesn't hang if no local mongod
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });

    isMongooseConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isMongooseConnected = false;
    console.warn(`[Database] MongoDB connection at ${mongoURI} was not reachable (${error.message}).`);
    console.log(`[Database] Operating in persistent local store mode for zero-config execution. To connect to MongoDB Atlas, add your MONGO_URI in server/.env.`);
    return false;
  }
};

export const getIsMongooseConnected = () => isMongooseConnected;
