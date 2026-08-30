import rateLimit from 'express-rate-limit';

// Public submission rate limiter: 15 submissions per minute per IP
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 requests per IP
  standardHeaders: true, // Return standard rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many submissions from this IP, please try again later.',
      statusCode: 429,
      retryAfter: Math.ceil(req.rateLimit.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
    });
  },
});

// General public endpoint limiter: 60 requests per minute
export const publicEndpointLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded, please try again later.',
      statusCode: 429,
    });
  },
});
