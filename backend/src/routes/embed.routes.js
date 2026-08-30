import { Router } from 'express';
import { EmbedController } from '../controllers/embed.controller.js';
import { publicCors } from '../middleware/cors.js';

const router = Router();

// Cross-origin preflight handling
router.options('/widget.js', publicCors);
router.options('/widgets/:id/config', publicCors);

// Public script delivery
router.get('/widget.js', publicCors, EmbedController.getScript);

// Public widget configuration delivery
router.get('/widgets/:id/config', publicCors, EmbedController.getConfig);

export default router;
