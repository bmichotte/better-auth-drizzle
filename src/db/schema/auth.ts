import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schema/utils";

const roles = ["user", "admin"] as const;
export type UserRoles = (typeof roles)[number];
export const userRoles = pgEnum("user_role", roles);

export type UserOptions = {};

export const usersTable = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  firstname: text().notNull(),
  lastname: text().notNull(),
  country: text().default("BE"),
  locale: text().default("fr"),
  emailVerified: boolean()
    .$defaultFn(() => false)
    .notNull(),
  image: text(),
  role: userRoles().default("user"),
  stripeCustomerId: text(),
  banned: boolean(),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true }),
  options: jsonb().$type<UserOptions>().default({}),
  ...timestamps,
});

export const sessionsTable = pgTable("sessions", {
  id: text().primaryKey(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  impersonatedBy: text(),
  ...timestamps,
});

export const accountsTable = pgTable("accounts", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  ...timestamps,
});

export const verificationsTable = pgTable("verifications", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ...timestamps,
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: text().primaryKey(),
  plan: text().notNull(),
  referenceId: text().notNull().unique(),
  stripeCustomerId: text(),
  stripeSubscriptionId: text(),
  status: text().default("incomplete"),
  periodStart: timestamp({ withTimezone: true }),
  periodEnd: timestamp({ withTimezone: true }),
  trialStart: timestamp({ withTimezone: true }),
  trialEnd: timestamp({ withTimezone: true }),
  cancelAtPeriodEnd: boolean().default(false),
  seats: integer(),
  ...timestamps,
});

export const plansTable = pgTable("plans", {
  id: text().primaryKey(),
  ...timestamps,
});

export const userRelations = relations(usersTable, ({ many }) => ({
  sessionsTable: many(sessionsTable),
  accountsTable: many(accountsTable),
}));

export const sessionRelations = relations(sessionsTable, ({ one }) => ({
  usersTable: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const accountRelations = relations(accountsTable, ({ one }) => ({
  usersTable: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));
