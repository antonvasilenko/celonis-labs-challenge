// contains business logic related to orders
import { retryDecorator } from 'ts-retry-promise';
import OrderModel from '../models/order';
import { InputOrderDto, OrderDto, PersonDto } from '../api/v1/dto';
import contactService from '../services/contactService';
import { NotFoundError } from '../errors';

// Domain: Order
// have no connections to api layer and express
// does know about DTOs and entities

const getOrders = (): Promise<OrderDto[]> => {
  return OrderModel.find().then((orders) =>
    orders.map((order) => ({
      ...order.toObject(),
      orderID: order._id.toString(),
      orderDate: order.createdAt!.toISOString().split('T')[0],
    })),
  );
};

const getOrder = async (orderID: string): Promise<OrderDto> => {
  const foundOrder = await OrderModel.findById(orderID).lean();
  if (!foundOrder) {
    throw new NotFoundError(orderID);
  }
  return {
    ...foundOrder,
    orderID: foundOrder._id.toString(),
    orderDate: foundOrder.createdAt!.toISOString().split('T')[0],
  };
};

const deleteOrder = async (orderID: string): Promise<OrderDto> => {
  const foundOrder = await OrderModel.findOneAndDelete({ _id: orderID }, { lean: true });
  if (!foundOrder) {
    throw new NotFoundError(orderID);
  }
  return {
    ...foundOrder,
    orderID: foundOrder._id.toString(),
    orderDate: foundOrder.createdAt!.toISOString().split('T')[0],
  };
};

const getPersonWithRetry = retryDecorator(contactService.getPerson, {
  retries: 3,
  delay: 200,
  retryIf: (error) => !(error instanceof NotFoundError),
});

// Note: api PersonDto and contactService.Person are equal
const getPerson = async (personID: string): Promise<PersonDto> => {
  try {
    return await getPersonWithRetry(personID);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.log('Error in getPerson', error);
    // if TimeoutError
    // 2. in-place retry
    return {
      id: personID,
    };
  }
};

const createOrder = async (inputOrder: InputOrderDto): Promise<OrderDto> => {
  const { orderValue, taxValue = null, currencyCode = null, items, ...rest } = inputOrder;

  try {
    console.log('Creating order', rest);
    // TODO avoid extra calls in case ids are the same
    const soldTo = await getPerson(rest.soldToID);
    const billTo = await getPerson(rest.billToID);
    const shipTo = await getPerson(rest.shipToID);
    console.log('Creating order', soldTo, billTo, shipTo);
    const orderData = {
      orderValue,
      taxValue,
      currencyCode,
      items,
      soldTo,
      billTo,
      shipTo,
    };
    const storedOrder = (await OrderModel.create(orderData)).toObject();

    return {
      ...storedOrder,
      orderID: storedOrder._id.toString(),
      orderDate: storedOrder.createdAt!.toISOString().split('T')[0],
      items: storedOrder.items.map((item) => ({
        ...item,
      })),
    };
  } catch (error) {
    console.error('Creating order failed', inputOrder, error);
    throw error;
  }
};

export default {
  getOrders,
  getOrder,
  createOrder,
  deleteOrder,
};
