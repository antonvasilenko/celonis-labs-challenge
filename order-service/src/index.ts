import createApp from './api/server';
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
  .catch((error) => {
    console.error('Error starting Order Service', error);
    throw error;
  });

process.on('SIGINT', async () => {
  console.log('Shutting down Order Service');
  await kafkaService.disconnectProducer();
  process.exit(0);
});
