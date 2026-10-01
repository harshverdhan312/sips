const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`Practice Platform Backend listening on port ${config.port} (${config.env})`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;
