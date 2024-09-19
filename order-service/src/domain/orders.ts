// contains business logic related to orders
import { retryDecorator } from 'ts-retry-promise';
import OrderModel, { OrderPerson } from '../models/order';
import { InputOrderDto, OrderDto, PersonDto, UpdateOrderDto } from '../api/http/v1/dto';
import contactService from '../services/contactService';
import { NotFoundError } from '../errors';
import * as kafkaService from '../services/kafkaService';

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
  // no await on purpose
  kafkaService.sendOrderDeletedEvent(orderID).catch((error: Error) => {
    console.error('Error sending order deleted event', error);
  });
  return {
    ...foundOrder,
    orderID: foundOrder._id.toString(),
    orderDate: foundOrder.createdAt!.toISOString().split('T')[0],
  };
};

const deleteOrders = async (): Promise<void> => {
  await OrderModel.deleteMany();
  // TODO find a way to send deletion events for affected entities
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
    // if TimeoutError or other error, return a partial person
    return {
      id: personID,
    };
  }
};

const withPerson = async (
  personId: string,
  callback: (person: PersonDto) => Promise<void>,
): Promise<void> => {
  try {
    const person = await getPersonWithRetry(personId);
    await callback(person);
  } catch (error) {
    console.warn('failed to get person', error);
  }
};

const createOrder = async (inputOrder: InputOrderDto): Promise<OrderDto> => {
  const { orderValue, taxValue = null, currencyCode = null, items, ...rest } = inputOrder;

  try {
    // TODO avoid extra calls in case ids are the same
    const soldTo = await getPerson(rest.soldToID);
    const billTo = await getPerson(rest.billToID);
    const shipTo = await getPerson(rest.shipToID);
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

    const orderID = storedOrder._id.toString();
    // no await on purpose
    kafkaService.sendOrderCreatedEvent(orderID).catch((error: Error) => {
      console.error('Error sending order created event', error);
    });

    return {
      ...storedOrder,
      orderID,
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

const updateOrder = async (orderID: string, inputOrder: UpdateOrderDto): Promise<OrderDto> => {
  // prevent updating persons (personIDs)
  const { orderValue, taxValue, currencyCode, items } = inputOrder;
  const foundOrder = await OrderModel.findById(orderID);
  if (!foundOrder) {
    throw new NotFoundError(orderID);
  }
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderID,
    {
      orderValue,
      taxValue,
      currencyCode,
      items,
    },
    { new: true, lean: true },
  );
  if (!updatedOrder) {
    throw new NotFoundError(orderID);
  }
  // no await on purpose
  kafkaService.sendOrderUpdatedEvent(orderID).catch((error: Error) => {
    console.error('Error sending order updated event', error);
  });

  return {
    ...updatedOrder,
    orderID: updatedOrder._id.toString(),
    orderDate: updatedOrder.createdAt!.toISOString().split('T')[0],
  };
};

const updatePersonInOrders = async (personId: string): Promise<void> => {
  const relevantOrders = await OrderModel.countDocuments({
    $or: [{ 'soldTo.id': personId }, { 'billTo.id': personId }, { 'shipTo.id': personId }],
  });

  if (relevantOrders === 0) {
    return;
  }

  await withPerson(personId, async (person) => {
    const orderPerson: OrderPerson = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      streetAddress: person.streetAddress,
      houseNumber: person.houseNumber,
      zip: person.zip,
      city: person.city,
      country: person.country,
      extensionFields: person.extensionFields,
    };
    const res1 = await OrderModel.updateMany(
      { 'soldTo.id': personId },
      { $set: { soldTo: orderPerson } },
    );
    const res2 = await OrderModel.updateMany(
      { 'billTo.id': personId },
      { $set: { billTo: orderPerson } },
    );
    const res3 = await OrderModel.updateMany(
      { 'shipTo.id': personId },
      { $set: { shipTo: orderPerson } },
    );
    console.log(
      `Person with id ${personId} updated in ${res1.modifiedCount + res2.modifiedCount + res3.modifiedCount} orders`,
    );
  });
};

export default {
  getOrders,
  getOrder,
  createOrder,
  deleteOrder,
  deleteOrders,
  updateOrder,
  updatePersonInOrders,
};
