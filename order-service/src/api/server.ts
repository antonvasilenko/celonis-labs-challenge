// src/app.ts
import { Request, Response, NextFunction } from 'express';
import { zodiosApp } from '@zodios/express';
import ordersRouter from './v1/order';

const createApp = () => {
  const app = zodiosApp();

  app.use(ordersRouter);

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
