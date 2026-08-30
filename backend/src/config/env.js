import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'flyrank',
    password: process.env.DB_PASSWORD || 'flyrank123',
    database: process.env.DB_NAME || 'flyrank_widgets',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  testSiteOrigin: process.env.TEST_SITE_ORIGIN || 'http://localhost:5500',
};
