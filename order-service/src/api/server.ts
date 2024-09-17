// src/app.ts
import path from 'node:path';
import { Request, Response, NextFunction } from 'express';
import { zodiosApp } from '@zodios/express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import config from '../config';

import ordersRouter from './v1/order';

const createApp = () => {
  const app = zodiosApp();

  app.use(ordersRouter);

  // openapi docs
  const openApiSpecPath = path.join(__dirname, '../../order_service_openapi.yaml');
  const openApiSpec = YAML.load(openApiSpecPath);

  // @ts-expect-error - openApiSpec is not compatible with the type expected by swaggerUi
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

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
