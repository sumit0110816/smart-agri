require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security & Middleware ---
app.disable('x-powered-by');

// Basic Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

// --- Request Logger (dev) ---
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/price', require('./routes/price'));
app.use('/api/demand', require('./routes/demand'));
app.use('/api/market', require('./routes/market'));
app.use('/api/crop', require('./routes/crop'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/retailer', require('./routes/retailer'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/news', require('./routes/news'));
app.use('/api/yojana', require('./routes/yojana'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/voice', require('./routes/voice'));

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'AgriSmart API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// --- Serve static frontend in production ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🌾 AgriSmart Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using default'}\n`);
});
