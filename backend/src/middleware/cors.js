import cors from 'cors';

// Permissive CORS for public endpoints (submissions, config, widget.js)
export const publicCors = cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
  exposedHeaders: ['Idempotency-Key', 'Retry-After'],
  credentials: false,
});

// Admin CORS for owner dashboard & widget management API
export const apiCors = cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  credentials: true,
});
