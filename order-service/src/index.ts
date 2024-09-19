import createApp from './api/http/server';
import connectDb from './db';
import * as kafkaService from './services/kafkaService';
import config from './config';
import queueHandler from './api/queue';

connectDb()
  .then(() => kafkaService.connectProducer())
  .then(() => {
    createApp().listen(config.server.port, () => {
      console.log(`Order Service listening at port ${config.server.port}`);
    });
  })
  // connet consumer
  .then(() => kafkaService.connectConsumer(queueHandler))
  .catch((error) => {
    console.error('Error starting Order Service', error);
    throw error;
  });

const gracefulShutdown = async () => {
  console.log('Shutting down Order Service');

  await Promise.all([kafkaService.disconnectConsumer(), kafkaService.disconnectProducer()]);
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
