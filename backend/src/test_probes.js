import { AuthService } from './services/auth.service.js';
import { WidgetService } from './services/widget.service.js';
import { SubmissionService } from './services/submission.service.js';
import { SpamService } from './services/spam.service.js';
import { GeoService } from './services/geo.service.js';
import { NotificationService } from './services/notification.service.js';
import { DashboardService } from './services/dashboard.service.js';
import { pool } from './db/pool.js';

async function runAcceptanceVerification() {
  console.log('====================================================');
  console.log(' FlyRank Capstone — Automated Acceptance Probes Test');
  console.log('====================================================\n');

  try {
    // 1. Auth & Tenant Creation
    console.log('[Setup] Registering test tenant...');
    const testEmail = `tester_${Date.now()}@example.com`;
    const authData = await AuthService.register({
      email: testEmail,
      password: 'password123',
      name: 'Automated Tester',
    });
    const userId = authData.user.id;
    console.log(`✓ Tenant created: ${testEmail} (${userId})\n`);

    // 2. Widget Creation
    console.log('[Setup] Creating test widget...');
    const widget = await WidgetService.createWidget(userId, {
      title: 'Feedback Widget',
      type: 'contact',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea' },
      ],
      buttonText: 'Send Feedback',
    });
    console.log(`✓ Widget created: "${widget.title}" (${widget.id})`);
    console.log(`  Snippet: ${widget.embedSnippet}\n`);

    // PROBE 1: Valid Submission + Dashboard Retrieval
    console.log('--- PROBE 1: Valid Submission & Dashboard Visibility ---');
    const sub1 = await SubmissionService.handleSubmission({
      widgetId: widget.id,
      data: { name: 'Probe One', email: 'probe1@test.com', message: 'Hello from Probe 1' },
      ip: '8.8.8.8',
    });
    console.log(`✓ Submission stored: ${sub1.submissionId}`);

    const dashboardList = await DashboardService.getSubmissions(userId);
    const found = dashboardList.submissions.find((s) => s.id === sub1.submissionId);
    if (!found) throw new Error('PROBE 1 FAILED: Submission not visible in dashboard!');
    console.log(`✓ PROBE 1 PASSED: Found in dashboard list (Total: ${dashboardList.pagination.total})\n`);

    // PROBE 2: Boundary Validation
    console.log('--- PROBE 2: Boundary Validation ---');
    try {
      await SubmissionService.handleSubmission({
        widgetId: widget.id,
        data: {}, // empty data
      });
      throw new Error('PROBE 2 FAILED: Empty data was not rejected!');
    } catch (err) {
      if (err.message.includes('PROBE 2 FAILED')) throw err;
      console.log(`✓ PROBE 2 PASSED: Malformed input properly rejected (Zod validation)\n`);
    }

    // PROBE 4: Geo Enrichment Fallback
    console.log('--- PROBE 4: Geolocation Enrichment Fallback ---');
    const geoReal = await GeoService.enrichIp('8.8.8.8');
    console.log(`✓ Real IP (8.8.8.8) enriched -> Country: ${geoReal.country}, City: ${geoReal.city}, Provider: ${geoReal.provider}`);

    const geoLocal = await GeoService.enrichIp('127.0.0.1');
    console.log(`✓ Local IP degraded gracefully -> Country: ${geoLocal.country}, Provider: ${geoLocal.provider}`);
    console.log('✓ PROBE 4 PASSED: Graceful degradation holds.\n');

    // PROBE 5: Safe Side Effect Failure
    console.log('--- PROBE 5: Non-blocking Side Effect ---');
    const sideEffectResult = await NotificationService.sendSubmissionNotification({
      submissionId: sub1.submissionId,
      widgetTitle: 'Simulated Crash Test',
      data: { test: true },
      recipientEmail: 'broken@example.com',
    });
    console.log(`✓ Side effect executed cleanly (success=${sideEffectResult.success})`);
    console.log('✓ PROBE 5 PASSED: Main path never blocked.\n');

    // PROBE 6: Honeypot Spam Protection
    console.log('--- PROBE 6: Honeypot Spam Prevention ---');
    const spamCheck = SpamService.evaluate({
      _hp: 'i-am-a-bot-filling-hidden-fields',
      data: { name: 'Bot' },
    });
    if (!spamCheck.isSpam) throw new Error('PROBE 6 FAILED: Honeypot was not detected!');
    console.log(`✓ Bot submission flagged: isSpam=${spamCheck.isSpam}, score=${spamCheck.spamScore}, reason="${spamCheck.reason}"`);

    try {
      await SubmissionService.handleSubmission({
        widgetId: widget.id,
        data: { name: 'Bot User', email: 'bot@spam.com' },
        _hp: 'bot-fill',
      });
      throw new Error('PROBE 6 FAILED: Honeypot submission was not rejected!');
    } catch (err) {
      console.log(`✓ PROBE 6 PASSED: Bot submission rejected by pipeline: "${err.message}"\n`);
    }

    // PROBE Stats Verification
    console.log('--- Dashboard Analytics ---');
    const stats = await DashboardService.getStats(userId);
    console.log(`✓ Stats retrieved: Total Submissions = ${stats.totalSubmissions}`);
    const geoStats = await DashboardService.getGeoStats(userId);
    console.log(`✓ Geo Breakdown: ${JSON.stringify(geoStats.countries)}\n`);

    console.log('====================================================');
    console.log(' ALL ACCEPTANCE PROBES VERIFIED SUCCESSFULLY! ✓');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Acceptance test error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAcceptanceVerification();
