import { eq, and } from 'drizzle-orm';
import { db, widgets } from '../db/drizzle.js';
import { env } from '../config/env.js';
import { NotFoundError } from '../utils/httpErrors.js';

export class WidgetService {
  static async createWidget(userId, payload) {
    const [widget] = await db
      .insert(widgets)
      .values({
        userId,
        type: payload.type || 'signup',
        title: payload.title,
        description: payload.description,
        fields: payload.fields,
        buttonText: payload.buttonText || 'Submit',
        displayOptions: payload.displayOptions || {},
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      })
      .returning();

    return {
      ...widget,
      embedSnippet: this.generateSnippet(widget.id),
    };
  }

  static async listWidgets(userId) {
    const userWidgets = await db
      .select()
      .from(widgets)
      .where(eq(widgets.userId, userId))
      .orderBy(widgets.createdAt);

    return userWidgets.map((w) => ({
      ...w,
      embedSnippet: this.generateSnippet(w.id),
    }));
  }

  static async getWidgetById(userId, widgetId) {
    const [widget] = await db
      .select()
      .from(widgets)
      .where(and(eq(widgets.id, widgetId), eq(widgets.userId, userId)));

    if (!widget) {
      throw new NotFoundError('Widget not found or access denied');
    }

    return {
      ...widget,
      embedSnippet: this.generateSnippet(widget.id),
    };
  }

  static async updateWidget(userId, widgetId, payload) {
    const [existing] = await db
      .select()
      .from(widgets)
      .where(and(eq(widgets.id, widgetId), eq(widgets.userId, userId)));

    if (!existing) {
      throw new NotFoundError('Widget not found or access denied');
    }

    const [updated] = await db
      .update(widgets)
      .set({
        ...payload,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(widgets.id, widgetId), eq(widgets.userId, userId)))
      .returning();

    return {
      ...updated,
      embedSnippet: this.generateSnippet(updated.id),
    };
  }

  static async deleteWidget(userId, widgetId) {
    const [deleted] = await db
      .delete(widgets)
      .where(and(eq(widgets.id, widgetId), eq(widgets.userId, userId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Widget not found or access denied');
    }

    return { success: true, message: 'Widget deleted successfully' };
  }

  static generateSnippet(widgetId) {
    return `<script src="${env.apiBaseUrl}/widget.js?id=${widgetId}" async></script>`;
  }

  // Public config retrieval for embed script
  static async getPublicConfig(widgetId) {
    const [widget] = await db
      .select({
        id: widgets.id,
        type: widgets.type,
        title: widgets.title,
        description: widgets.description,
        fields: widgets.fields,
        buttonText: widgets.buttonText,
        displayOptions: widgets.displayOptions,
        version: widgets.version,
        isActive: widgets.isActive,
      })
      .from(widgets)
      .where(eq(widgets.id, widgetId));

    if (!widget || !widget.isActive) {
      throw new NotFoundError('Widget not found or inactive');
    }

    return {
      ...widget,
      submitUrl: `${env.apiBaseUrl}/api/submissions`,
    };
  }
}
