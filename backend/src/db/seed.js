import bcrypt from 'bcryptjs';
import { db, users, widgets, submissions, pool } from './drizzle.js';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    console.log('[Drizzle] Seeding demo data...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create or fetch demo user
    let [user] = await db.select().from(users).where(eq(users.email, 'demo@flyrank.com'));
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: 'demo@flyrank.com',
          passwordHash,
          name: 'Demo Owner',
        })
        .returning();
      console.log(`[Drizzle] Created user: ${user.email} (${user.id})`);
    } else {
      console.log(`[Drizzle] User already exists: ${user.email} (${user.id})`);
    }

    // 2. Create demo widget
    const [widget] = await db
      .insert(widgets)
      .values({
        userId: user.id,
        type: 'signup',
        title: 'Newsletter Signup Form',
        description: 'Subscribe to our weekly product updates and insights.',
        fields: [
          { name: 'name', label: 'Your Name', type: 'text', required: true },
          { name: 'email', label: 'Email Address', type: 'email', required: true },
        ],
        buttonText: 'Subscribe Now',
        displayOptions: { themeColor: '#4f46e5', position: 'inline' },
      })
      .returning();
    console.log(`[Drizzle] Created widget: ${widget.title} (${widget.id})`);

    // 3. Create demo submission
    const [submission] = await db
      .insert(submissions)
      .values({
        widgetId: widget.id,
        userId: user.id,
        data: { name: 'Alice Visitor', email: 'alice@example.com' },
        ipAddress: '8.8.8.8',
        geoCountry: 'United States',
        geoCity: 'Ashburn',
        geoProvider: 'ip-api.com',
        idempotencyKey: 'seed-demo-sub-1',
      })
      .onConflictDoNothing()
      .returning();
    if (submission) {
      console.log(`[Drizzle] Created submission: ${submission.id}`);
    }

    console.log('[Drizzle] Seeding completed.');
  } catch (err) {
    console.error('[Drizzle] Seeding error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
