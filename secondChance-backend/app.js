const express = require('express');
const cors = require('cors');
const path = require('path');
const { port } = require('./config');
const { connectToDatabase } = require('./models/db');

const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Landing page (public/index.html) and uploaded images (public/images)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---- API routes ----
app.use('/api/secondchance/items', secondChanceItemsRoutes);
app.use('/api/secondchance/search', searchRoutes); // search & filter items
app.use('/api/auth', authRoutes);

// ---- 404 + error handling ----
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  if (status === 500) console.error(err); // eslint-disable-line no-console
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

if (require.main === module) {
  connectToDatabase()
    .then(() => app.listen(port, () => console.log(`SecondChance API running on http://localhost:${port}`))) // eslint-disable-line no-console
    .catch((err) => {
      console.error('Could not connect to MongoDB:', err.message); // eslint-disable-line no-console
      process.exit(1);
    });
}

module.exports = app;
