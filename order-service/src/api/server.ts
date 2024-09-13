// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import ordersApi from './v1/order';

const createApp = (): Express => {
  const app = express();

  // Middleware to parse JSON request bodies
  app.use(express.json());
  // handle /order in orders.ts
  app.use('/api/v1/order', ordersApi(express.Router()));

  // Middleware to handle unhandled routes (404)
  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Middleware to handle uncaught errors
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error('Uncaught error:', err);
    res.status(500).json({ message: 'An internal server error occurred' });
  });
  return app;
};

export default createApp;
