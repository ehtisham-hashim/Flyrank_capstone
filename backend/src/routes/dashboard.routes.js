import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All dashboard routes are tenant-scoped and require authentication
router.use(requireAuth);

router.get('/submissions', DashboardController.getSubmissions);
router.get('/stats', DashboardController.getStats);
router.get('/geo', DashboardController.getGeoStats);

export default router;
