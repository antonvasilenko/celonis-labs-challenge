import createApp from './api/http/server';
import connectDb from './db';
import * as kafkaService from './services/kafkaService';
import config from './config';

connectDb()
  .then(() => kafkaService.connectProducer())
  .then(() => {
    createApp().listen(config.server.port, () => {
      console.log(`Order Service listening at port ${config.server.port}`);
    });
  })
  // connet consumer
  .then(() => kafkaService.connectConsumer())
  .catch((error) => {
    console.error('Error starting Order Service', error);
    throw error;
  });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

process.on('SIGINT', async () => {
  console.log('Shutting down Order Service');
  await kafkaService.disconnectConsumer();
  await delay(200);
  await kafkaService.disconnectProducer();
  process.exit(0);
});
