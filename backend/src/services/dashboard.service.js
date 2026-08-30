import { eq, and, sql, desc } from 'drizzle-orm';
import { db, submissions, widgets } from '../db/drizzle.js';

export class DashboardService {
  static async getSubmissions(userId, { page = 1, limit = 20, widgetId } = {}) {
    const offset = (page - 1) * limit;

    const conditions = [eq(submissions.userId, userId)];
    if (widgetId) {
      conditions.push(eq(submissions.widgetId, widgetId));
    }

    const whereClause = and(...conditions);

    const items = await db
      .select({
        id: submissions.id,
        widgetId: submissions.widgetId,
        widgetTitle: widgets.title,
        data: submissions.data,
        ipAddress: submissions.ipAddress,
        geoCountry: submissions.geoCountry,
        geoCity: submissions.geoCity,
        geoProvider: submissions.geoProvider,
        isSpam: submissions.isSpam,
        notificationSent: submissions.notificationSent,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .leftJoin(widgets, eq(submissions.widgetId, widgets.id))
      .where(whereClause)
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(submissions)
      .where(whereClause);

    return {
      submissions: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount?.count || 0,
        totalPages: Math.ceil((totalCount?.count || 0) / limit),
      },
    };
  }

  static async getStats(userId) {
    // Total submissions count
    const [totalSubmissions] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(submissions)
      .where(eq(submissions.userId, userId));

    // Submissions grouped by widget
    const perWidget = await db
      .select({
        widgetId: widgets.id,
        widgetTitle: widgets.title,
        type: widgets.type,
        count: sql`COUNT(${submissions.id})::int`,
      })
      .from(widgets)
      .leftJoin(submissions, eq(widgets.id, submissions.widgetId))
      .where(eq(widgets.userId, userId))
      .groupBy(widgets.id, widgets.title, widgets.type);

    // Submissions over last 7 days
    const recentActivity = await db
      .select({
        date: sql`DATE_TRUNC('day', ${submissions.createdAt})::date`,
        count: sql`COUNT(*)::int`,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          sql`${submissions.createdAt} >= NOW() - INTERVAL '7 days'`
        )
      )
      .groupBy(sql`DATE_TRUNC('day', ${submissions.createdAt})::date`)
      .orderBy(sql`DATE_TRUNC('day', ${submissions.createdAt})::date ASC`);

    return {
      totalSubmissions: totalSubmissions?.count || 0,
      perWidget,
      recentActivity,
    };
  }

  static async getGeoStats(userId) {
    const countries = await db
      .select({
        country: sql`COALESCE(${submissions.geoCountry}, 'Unknown')`,
        count: sql`COUNT(*)::int`,
      })
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .groupBy(sql`COALESCE(${submissions.geoCountry}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)::int`))
      .limit(10);

    const cities = await db
      .select({
        city: sql`COALESCE(${submissions.geoCity}, 'Unknown')`,
        country: sql`COALESCE(${submissions.geoCountry}, 'Unknown')`,
        count: sql`COUNT(*)::int`,
      })
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .groupBy(sql`COALESCE(${submissions.geoCity}, 'Unknown')`, sql`COALESCE(${submissions.geoCountry}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)::int`))
      .limit(10);

    return {
      countries,
      cities,
    };
  }
}
