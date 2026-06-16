import mongoose from 'mongoose';
import app from '../src/app';
import config from '../src/app/config';

// Cache the connection across warm serverless invocations.
// Without this, every Vercel function cold-start creates a new connection,
// and queries time out because Mongoose is still buffering while connecting.
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(config.DatabaseURL as string);
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

// Vercel expects a default export of the request handler.
// We wrap it so the DB is always connected before Express handles anything.
export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
