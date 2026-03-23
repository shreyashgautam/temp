require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes/index');
const whatsappRoute = require('./routes/whatsapp');
const blockchain = require('./blockchain/logger');

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function isAllowedVercelOrigin(origin) {
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(String(origin || '').trim());
}

function buildCorsOptions() {
  const configured = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const inferred = [
    process.env.VERCEL_URL ? normalizeOrigin(`https://${process.env.VERCEL_URL}`) : null,
    'https://clinsightai.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);

  const allowlist = [...new Set([...configured, ...inferred])];
  const allowSet = new Set(allowlist.map(normalizeOrigin));

  return {
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);
      if (!normalizedOrigin) {
        callback(null, true);
        return;
      }
      if (allowSet.has(normalizedOrigin) || isAllowedVercelOrigin(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    optionsSuccessStatus: 204,
  };
}

function createApp(io) {
  const app = express();
  const corsOptions = buildCorsOptions();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
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
