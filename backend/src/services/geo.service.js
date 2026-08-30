export class GeoService {
  /**
   * Enriches an IP address with location data using a fallback chain.
   * Chain: Provider A (ip-api.com) -> Provider B (ipapi.co) -> null (graceful degradation)
   * @param {string} ip
   * @returns {Promise<{ country: string | null, city: string | null, provider: string | null }>}
   */
  static async enrichIp(ip) {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      // Local development or private IP
      return {
        country: 'Localhost',
        city: 'Local Dev',
        provider: 'local',
      };
    }

    // Try Provider A: ip-api.com
    try {
      const resultA = await this.fetchFromIpApi(ip);
      if (resultA) return resultA;
    } catch (err) {
      console.warn(`[Geo] Provider A (ip-api.com) failed for ${ip}: ${err.message}. Trying fallback...`);
    }

    // Try Provider B: ipapi.co
    try {
      const resultB = await this.fetchFromIpApiCo(ip);
      if (resultB) return resultB;
    } catch (err) {
      console.warn(`[Geo] Provider B (ipapi.co) failed for ${ip}: ${err.message}. Falling back to null.`);
    }

    // Fallback: Degrade gracefully, never fail the submission
    return {
      country: null,
      city: null,
      provider: null,
    };
  }

  static async fetchFromIpApi(ip) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country || null,
          city: data.city || null,
          provider: 'ip-api.com',
        };
      }
      throw new Error(data.message || 'Lookup unsuccessful');
    } finally {
      clearTimeout(timeout);
    }
  }

  static async fetchFromIpApiCo(ip) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'FlyRank-Capstone-Enricher/1.0' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.country_name) {
        return {
          country: data.country_name || null,
          city: data.city || null,
          provider: 'ipapi.co',
        };
      }
      throw new Error('No country in response');
    } finally {
      clearTimeout(timeout);
    }
  }
}
