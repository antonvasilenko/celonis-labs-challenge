import express, { Express, Request, Response, NextFunction, Router } from 'express';

const getOrders = (req: Request, res: Response) => {
  res.json([]);
};

const createOrder = (req: Request, res: Response) => {};

const deleteAllOrders = (req: Request, res: Response) => {};

export default (app: Router): Router => {
  app.get('/', getOrders);
  app.post('/', createOrder);
  app.delete('/', deleteAllOrders);

  return app;
};
