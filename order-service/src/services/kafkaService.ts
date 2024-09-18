import { Kafka } from 'kafkajs';
import { CloudEvent, CloudEventV1 } from 'cloudevents';
import config from '../config';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [config.kafka.brokerUrl],
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
  console.log('Connected to Kafka producer');
};

export const disconnectProducer = async () => {
  await producer.disconnect();
};

// ?? what should be there
const SOURCE_ORDER_SERVICE = '/v1/api/order';

const createCloudEvent = <T>(type: string, data: T): CloudEvent<T> => {
  const event = new CloudEvent({
    type: type,
    source: SOURCE_ORDER_SERVICE,
    datacontenttype: 'application/json',
    data: data,
  });
  return event;
};

const sendToTopic = async <T>(event: CloudEvent<T>) => {
  await producer.send({
    topic: 'orderevents',
    messages: [{ value: JSON.stringify(event) }],
  });
};

// decision: publish all events into same stream
export const sendOrderCreatedEvent = async (orderid: string) => {
  const event = createCloudEvent('order.created', { orderid });
  await sendToTopic(event);
};

export const sendOrderUpdatedEvent = async (orderid: string) => {
  const event = createCloudEvent('order.changed', { orderid });
  await sendToTopic(event);
};

export const sendOrderDeletedEvent = async (orderid: string) => {
  const event = createCloudEvent('order.deleted', { orderid });
  await sendToTopic(event);
};
