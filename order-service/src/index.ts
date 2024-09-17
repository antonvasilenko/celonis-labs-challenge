import createApp from './api/server';
import connectDb from './db';
import config from './config';

connectDb()
  .then(() => {
    createApp().listen(config.server.port, () => {
      console.log(`Order Service listening at port ${config.server.port}`);
    });
  })
  .catch((error) => {
    console.error('Error starting Order Service', error);
    throw error;
  });
