import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { zodiosRouter } from '@zodios/express';
import orderDomain from '../../domain/orders';
import { dto } from './dto';

export const ordersApi = makeApi([
  {
    method: 'get',
    path: '/api/v1/order',
    description: `This function retrieves all orders.`,
    requestFormat: 'json',
    response: z.array(dto.Order),
  },
  {
    method: 'post',
    path: '/api/v1/order',
    description: `This function creates a new order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: dto.InputOrder,
      },
    ],
    response: dto.Order,
  },
  {
    method: 'delete',
    path: '/api/v1/order',
    description: `This function deletes all orders.`,
    requestFormat: 'json',
    response: dto.Order,
  },
  {
    method: 'get',
    path: '/api/v1/order/:orderID',
    description: `This function reads a single order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'orderID',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: dto.Order,
  },
  {
    method: 'put',
    path: '/api/v1/order/:orderID',
    description: `This function updates an order. This does not support delta updates.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: dto.InputOrder,
      },
      {
        name: 'orderID',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: dto.Order,
  },
  {
    method: 'patch',
    path: '/api/v1/order/:orderID',
    description: `This function updates a single order. This does support delta updates.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: dto.InputOrder,
      },
      {
        name: 'orderID',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: dto.Order,
  },
  {
    method: 'delete',
    path: '/api/v1/order/:orderID',
    description: `This function deletes a single order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'orderID',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: dto.Order,
  },
]);

const router = zodiosRouter(ordersApi);

router.get('/api/v1/order', async (req, res) => {
  const orders = await orderDomain.getOrders();
  res.status(200).json(z.array(dto.Order).parse(orders));
});

router.post('/api/v1/order', async (req, res) => {
  const order = req.body;
  const createdOrder = await orderDomain.createOrder(order);
  res.status(200).json(dto.Order.parse(createdOrder));
});

export default router;
