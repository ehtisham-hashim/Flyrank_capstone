import { z } from 'zod';

export const submissionSchema = z.object({
  widgetId: z.string().uuid('Invalid widget ID format'),
  data: z.record(z.any()).refine((val) => Object.keys(val).length > 0, {
    message: 'Form submission data cannot be empty',
  }),
  _hp: z.string().optional(), // Honeypot field (bots fill this, humans do not)
  idempotencyKey: z.string().max(255).optional(),
});
