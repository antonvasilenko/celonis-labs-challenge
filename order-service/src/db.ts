import mongoose from 'mongoose';
import config from './config';

const connectDb = async () => {
  try {
    await mongoose.connect(config.mongo.url);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDb;
