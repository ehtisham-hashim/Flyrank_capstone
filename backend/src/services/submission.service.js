import { eq, and } from 'drizzle-orm';
import { db, widgets, submissions, users } from '../db/drizzle.js';
import { SpamService } from './spam.service.js';
import { GeoService } from './geo.service.js';
import { NotificationService } from './notification.service.js';
import { NotFoundError, BadRequestError } from '../utils/httpErrors.js';

import { submissionSchema } from '../validators/submission.validator.js';

export class SubmissionService {
  /**
   * Processes a public form submission end-to-end.
   * @param {Object} params - { widgetId, data, _hp, idempotencyKey, ip }
   */
  static async handleSubmission({ widgetId, data, _hp, idempotencyKey, ip }) {
    // 0. Validate boundary input
    submissionSchema.parse({ widgetId, data, _hp, idempotencyKey });
    // 1. Fetch widget and owner details
    const [widget] = await db
      .select({
        id: widgets.id,
        userId: widgets.userId,
        title: widgets.title,
        isActive: widgets.isActive,
        fields: widgets.fields,
      })
      .from(widgets)
      .where(eq(widgets.id, widgetId));

    if (!widget || !widget.isActive) {
      throw new NotFoundError('Widget not found or inactive');
    }

    // 2. Idempotency check: duplicate key -> return existing submission
    if (idempotencyKey) {
      const [existing] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.idempotencyKey, idempotencyKey));

      if (existing) {
        return {
          success: true,
          submissionId: existing.id,
          isDuplicate: true,
          message: 'Submission already processed (idempotent)',
        };
      }
    }

    // 3. Spam Evaluation (Honeypot + heuristics)
    const spamResult = SpamService.evaluate({ _hp, data });
    if (spamResult.isSpam && spamResult.spamScore >= 1.0) {
      // Honeypot tripped: reject with clean 400
      throw new BadRequestError('Submission rejected by spam protection filter');
    }

    // 4. Geolocation Enrichment (Provider A -> Provider B -> null fallback)
    const geo = await GeoService.enrichIp(ip);

    // 5. Database Persistence
    const [submission] = await db
      .insert(submissions)
      .values({
        widgetId: widget.id,
        userId: widget.userId,
        data,
        ipAddress: ip || 'unknown',
        geoCountry: geo.country,
        geoCity: geo.city,
        geoProvider: geo.provider,
        idempotencyKey: idempotencyKey || null,
        spamScore: spamResult.spamScore,
        isSpam: spamResult.isSpam,
      })
      .returning();

    // 6. Safe Asynchronous Side Effect (Fire-and-forget, never breaks response)
    NotificationService.sendSubmissionNotification({
      submissionId: submission.id,
      widgetTitle: widget.title,
      data,
    }).catch((err) => {
      console.error('[Async SideEffect Error]', err);
    });

    return {
      success: true,
      submissionId: submission.id,
      enriched: Boolean(geo.country),
      message: 'Submission successfully recorded',
    };
  }
}
