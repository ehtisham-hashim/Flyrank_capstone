import { Router } from 'express';
import { WidgetController } from '../controllers/widget.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createWidgetSchema, updateWidgetSchema } from '../validators/widget.validator.js';

const router = Router();

// All widget management routes require authentication
router.use(requireAuth);

router.post('/', validateBody(createWidgetSchema), WidgetController.create);
router.get('/', WidgetController.list);
router.get('/:id', WidgetController.getById);
router.put('/:id', validateBody(updateWidgetSchema), WidgetController.update);
router.delete('/:id', WidgetController.delete);
router.get('/:id/snippet', WidgetController.getSnippet);

export default router;
