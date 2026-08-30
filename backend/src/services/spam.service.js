export class SpamService {
  /**
   * Evaluates a submission payload for spam indicators.
   * @param {Object} payload - { data, _hp }
   * @returns {{ isSpam: boolean, spamScore: number, reason: string | null }}
   */
  static evaluate(payload) {
    const { _hp, data } = payload;

    // 1. Honeypot check: If the hidden honeypot field has any value, it's definitely a bot
    if (_hp && typeof _hp === 'string' && _hp.trim().length > 0) {
      return {
        isSpam: true,
        spamScore: 1.0,
        reason: 'Honeypot trap triggered',
      };
    }

    let score = 0.0;
    const stringified = JSON.stringify(data || {}).toLowerCase();

    // 2. Heuristic check: typical spam keywords / suspicious payload patterns
    const spamPatterns = [/\[url=/i, /casino/i, /crypto-lottery/i, /viagra/i, /http:\/\/.*\.(ru|cn|top|xyz)\b/i];
    for (const pattern of spamPatterns) {
      if (pattern.test(stringified)) {
        score += 0.5;
      }
    }

    const isSpam = score >= 0.8;
    return {
      isSpam,
      spamScore: Math.min(score, 1.0),
      reason: isSpam ? 'Suspicious content heuristics' : null,
    };
  }
}
