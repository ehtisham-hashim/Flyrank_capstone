import { ZodError } from 'zod';
import { AppError } from '../utils/httpErrors.js';

export const errorHandler = (err, req, res, next) => {
  // Handle JSON syntax error from bad client body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload',
      statusCode: 400,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = (err.issues || err.errors || []).map((e) => ({
      field: e.path ? e.path.join('.') : '',
      message: e.message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      statusCode: 400,
      details: formattedErrors,
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Default server error
  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    error: 'Internal Server Error',
    statusCode: 500,
  });
};
