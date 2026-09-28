const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
require('./models');

async function start() {
  await connectDB(config.mongoUri);
  const server = app.listen(config.port, () => {
    console.log(`SecondChance API listening on :${config.port} (${config.nodeEnv})`); // eslint-disable-line no-console
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`); // eslint-disable-line no-console
    server.close(async () => {
      await require('mongoose').disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err); // eslint-disable-line no-console
  process.exit(1);
});
