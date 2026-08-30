import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import { publicCors, apiCors } from './middleware/cors.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import embedRoutes from './routes/embed.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardHtmlPath = path.resolve(__dirname, '../../public/dashboard.html');

const app = express();

// 1. Boundary payload size limit: max 100KB to protect against DOS
app.use(express.json({ limit: '100kb' }));

// 2. Info & Dashboard UI endpoints
app.get('/dashboard', (req, res) => {
  res.sendFile(dashboardHtmlPath);
});

app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.sendFile(dashboardHtmlPath);
  }
  res.json({
    service: 'FlyRank Embeddable Widget & Lead-Capture Platform API',
    version: '1.0.0',
    status: 'running',
    dashboardUI: 'http://localhost:3000/dashboard',
    endpoints: {
      health: '/health',
      dashboardUI: '/dashboard',
      widgetScript: '/widget.js',
      widgetConfig: '/widgets/:id/config',
      publicSubmission: 'POST /api/submissions',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      widgetsCrud: '/api/widgets',
      dashboardSubmissions: '/api/dashboard/submissions',
    },
  });
});

app.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      service: 'flyrank-widget-platform',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbRes.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// 3. Public script & config delivery (CORS enabled, cached)
app.use('/', embedRoutes);

// 4. Public submissions endpoint (CORS enabled, rate limited, validated)
app.use('/api/submissions', submissionRoutes);

// 5. Protected management & auth routes
app.use('/api/auth', apiCors, authRoutes);
app.use('/api/widgets', apiCors, widgetRoutes);
app.use('/api/dashboard', apiCors, dashboardRoutes);

// 6. 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    statusCode: 404,
    path: req.originalUrl,
  });
});

// 7. Global error handler (always returns clean JSON, catches Zod, 4xx, 500)
app.use(errorHandler);

// Start server
app.listen(env.port, () => {
  console.log(`[Server] FlyRank Widget Platform running on ${env.apiBaseUrl}`);
  console.log(`[Server] Environment: ${env.nodeEnv}`);
});
