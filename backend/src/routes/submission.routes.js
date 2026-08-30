import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller.js';
import { publicCors } from '../middleware/cors.js';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { submissionSchema } from '../validators/submission.validator.js';

const router = Router();

// Handle cross-origin preflight requests
router.options('/', publicCors);

// Public submission POST endpoint
router.post(
  '/',
  publicCors,
  submissionRateLimiter,
  validateBody(submissionSchema),
  SubmissionController.submit
);

export default router;
