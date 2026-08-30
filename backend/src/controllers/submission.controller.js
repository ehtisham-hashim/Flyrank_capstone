import { SubmissionService } from '../services/submission.service.js';

export class SubmissionController {
  static async submit(req, res, next) {
    try {
      const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        req.ip;

      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

      const result = await SubmissionService.handleSubmission({
        widgetId: req.body.widgetId,
        data: req.body.data,
        _hp: req.body._hp,
        idempotencyKey,
        ip: clientIp,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}
