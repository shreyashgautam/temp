require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes/index');
const whatsappRoute = require('./routes/whatsapp');
const blockchain = require('./blockchain/logger');

function buildCorsOrigin() {
  const configured = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const inferred = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);

  const allowlist = [...new Set([...configured, ...inferred])];

  if (allowlist.length === 0) return true;

  return (origin, callback) => {
    if (!origin || allowlist.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

function createApp(io) {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: buildCorsOrigin() }));
  app.options('*', cors({ origin: buildCorsOrigin() }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  blockchain.init(io || null);

  app.use((req, res, next) => {
    req.io = io || null;
    next();
  });

  app.use('/api', routes);
  app.use('/api/whatsapp', whatsappRoute);

  app.get('/', (req, res) =>
    res.json({
      status: 'Patient Intelligence Backend Running',
      hospital: 'Kathir Memorial Hospital',
    })
  );

  app.get('/health', (req, res) =>
    res.json({
      ok: true,
      service: 'patient-intelligence-backend',
      timestamp: new Date().toISOString(),
    })
  );

  return app;
}

module.exports = { createApp };
