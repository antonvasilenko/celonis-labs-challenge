import createApp from './api/server';
import connectDb from './db';

const port = process.env.NODE_PORT || 8081;

connectDb()
  .then(() => {
    createApp().listen(port, () => {
      console.log(`Order Service listening at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error starting Order Service', error);
    throw error;
  });
