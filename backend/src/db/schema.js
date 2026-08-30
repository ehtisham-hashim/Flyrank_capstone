import { pgTable, uuid, varchar, text, jsonb, integer, boolean, real, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

export const widgets = pgTable(
  'widgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).default('signup').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    fields: jsonb('fields').default([]).notNull(),
    buttonText: varchar('button_text', { length: 100 }).default('Submit').notNull(),
    displayOptions: jsonb('display_options').default({}).notNull(),
    version: integer('version').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_widgets_user_id').on(table.userId),
    idUserIdx: index('idx_widgets_id_user_id').on(table.id, table.userId),
  })
);

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    widgetId: uuid('widget_id').notNull().references(() => widgets.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    data: jsonb('data').default({}).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    geoCountry: varchar('geo_country', { length: 100 }),
    geoCity: varchar('geo_city', { length: 100 }),
    geoProvider: varchar('geo_provider', { length: 50 }),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
    spamScore: real('spam_score').default(0.0),
    isSpam: boolean('is_spam').default(false),
    notificationSent: boolean('notification_sent').default(false),
    notificationError: text('notification_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    widgetIdIdx: index('idx_submissions_widget_id').on(table.widgetId, table.createdAt),
    userIdIdx: index('idx_submissions_user_id').on(table.userId, table.createdAt),
    idempotencyIdx: index('idx_submissions_idempotency').on(table.idempotencyKey),
  })
);
