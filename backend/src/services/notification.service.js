import { eq } from 'drizzle-orm';
import { db, submissions } from '../db/drizzle.js';

export class NotificationService {
  /**
   * Dispatches an asynchronous notification for a submission.
   * NEVER throws an error to the caller (safe side effect).
   * @param {Object} params - { submissionId, widgetTitle, data, email }
   */
  static async sendSubmissionNotification({ submissionId, widgetTitle, data, recipientEmail }) {
    try {
      console.log(`[Notification] Triggering confirmation for submission ${submissionId} (Widget: "${widgetTitle}")`);

      // Mock email / webhook dispatch (simulated side effect)
      // In production this would send SMTP or trigger a Webhook URL
      const emailContent = `New lead on "${widgetTitle}": ${JSON.stringify(data)}`;
      console.log(`[Email Dispatch -> ${recipientEmail || 'owner'}]:`, emailContent);

      // Record successful notification in DB
      await db
        .update(submissions)
        .set({
          notificationSent: true,
          notificationError: null,
        })
        .where(eq(submissions.id, submissionId));

      return { success: true };
    } catch (err) {
      console.error(`[Notification] Non-blocking side effect failed for submission ${submissionId}:`, err.message);

      // Record notification failure without affecting submission
      try {
        await db
          .update(submissions)
          .set({
            notificationSent: false,
            notificationError: err.message,
          })
          .where(eq(submissions.id, submissionId));
      } catch (dbErr) {
        console.error('[Notification] Failed to record error status:', dbErr.message);
      }

      return { success: false, error: err.message };
    }
  }
}
