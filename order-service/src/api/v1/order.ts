import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { zodiosRouter } from '@zodios/express';
import orderDomain from '../../domain/orders';
import { dto } from './dto';
import { NotFoundError } from '../../errors';

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
    errors: [
      {
        status: 404,
        description: 'Person not found',
        schema: z.object({
          message: z.string(),
        }),
      },
      {
        status: 500,
        description: 'Internal server error',
        schema: z.object({
          message: z.string(),
        }),
      },
    ],
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
    errors: [
      {
        status: 404,
        description: 'Person not found',
        schema: z.object({
          message: z.string(),
        }),
      },
    ],
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
    errors: [
      {
        status: 404,
        description: 'Person not found',
        schema: z.object({
          message: z.string(),
        }),
      },
      {
        status: 500,
        description: 'Internal server error',
        schema: z.object({
          message: z.string(),
        }),
      },
    ],
  },
]);

const router = zodiosRouter(ordersApi);

router.get('/api/v1/order/:orderID', async (req, res) => {
  const orderID = req.params.orderID;
  console.log('orderID', orderID);
  try {
    const order = await orderDomain.getOrder(orderID);
    return res.status(200).json(dto.Order.parse(order));
  } catch (error) {
    console.log('error', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: `Order with id '${orderID}' not found` });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/api/v1/order', async (req, res) => {
  const orders = await orderDomain.getOrders();
  res.status(200).json(z.array(dto.Order).parse(orders));
});

router.post('/api/v1/order', async (req, res) => {
  const order = req.body;
  const createdOrder = await orderDomain.createOrder(order);
  res.status(200).json(dto.Order.parse(createdOrder));
});

router.delete('/api/v1/order/:orderID', async (req, res) => {
  const orderID = req.params.orderID;
  try {
    const deletedOrder = await orderDomain.deleteOrder(orderID);
    return res.status(200).json(dto.Order.parse(deletedOrder));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: `Order with id '${orderID}' not found` });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
