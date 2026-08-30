import { z } from 'zod';

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').regex(/^[a-zA-Z0-9_]+$/, 'Field name must be alphanumeric'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'email', 'textarea', 'number', 'tel']).default('text'),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
});

export const createWidgetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  type: z.enum(['signup', 'contact', 'cta']).default('signup'),
  description: z.string().max(1000).optional(),
  fields: z.array(fieldSchema).min(1, 'At least one field is required'),
  buttonText: z.string().max(100).default('Submit'),
  displayOptions: z
    .object({
      themeColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid hex color').optional(),
      position: z.enum(['inline', 'bottom-right', 'bottom-left', 'modal']).optional(),
    })
    .passthrough()
    .default({}),
  isActive: z.boolean().default(true),
});

export const updateWidgetSchema = createWidgetSchema.partial();
