export default {
  server: {
    port: process.env.NODE_PORT || 8081,
  },
  contractServiceUrl: process.env.CONTACT_SERVICE_URL || 'http://localhost:8080',
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/order-service',
  },
};
