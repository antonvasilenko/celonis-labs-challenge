import { EachMessagePayload, Kafka } from 'kafkajs';
import { CloudEvent } from 'cloudevents';
import config from '../config';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [config.kafka.brokerUrl],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-service' });

export const connectProducer = async () => {
  await producer.connect();
  console.log('Connected to Kafka producer');
};

export const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'personevents-changed', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message, topic }: EachMessagePayload) => {
      const value = message.value?.toString();
      if (value) {
        try {
          // Parse the Kafka message as JSON
          const parsedValue = JSON.parse(value);
          console.log(`Received message from topic ${topic}:`, parsedValue);

          // Create a CloudEvent from the parsed JSON
          const event = new CloudEvent({
            id: parsedValue.id,
            type: parsedValue.type,
            source: parsedValue.source,
            specversion: parsedValue.specversion,
            datacontenttype: parsedValue.datacontenttype,
            data: parsedValue.data,
            ...(parsedValue.time && { time: parsedValue.time }), // Include time if it's present
          });

          // TODO add handler here
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    },
  });
};
export const disconnectProducer = async () => {
  await producer.disconnect();
};

export const disconnectConsumer = async () => {
  await consumer.disconnect();
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
