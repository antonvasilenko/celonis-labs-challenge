// contains business logic related to orders
import OrderModel from '../models/order';
import { InputOrderDto, OrderDto, PersonDto } from '../api/v1/dto';
import contactService, { NotFoundError } from '../services/contactService';

// Domain: Order
// have no connections to api layer and express
// does know about DTOs and entities

// Note: api PersonDto and contactService.Person are equal
const getPerson = async (personID: string): Promise<PersonDto> => {
  try {
    return await contactService.getPerson(personID);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
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
  createOrder,
};
