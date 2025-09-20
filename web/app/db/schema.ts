import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table - stores authenticated users by email or phone
export const usersTable = sqliteTable('users', {
  id: int().primaryKey({ autoIncrement: true }),
  contact: text().notNull().unique(), // email or phone number
  otpCode: text(), // current OTP code (nullable when no active OTP)
  otpExpiresAt: text(), // OTP expiration timestamp (nullable when no active OTP)
  createdAt: text()
    .notNull()
    .default(sql`(datetime('now'))`),
});

// User preferences table - stores privacy preferences for each user
export const userPreferencesTable = sqliteTable('user_preferences', {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  disallowPhoto: int().notNull().default(0), // 0 = false, 1 = true
  disallowGender: int().notNull().default(0),
  disallowBirthday: int().notNull().default(0),
  disallowAddress: int().notNull().default(0),
  disallowCompany: int().notNull().default(0),
  disallowTitle: int().notNull().default(0),
  contactProviderSynced: int().notNull().default(0), // 0 = false, 1 = true
  createdAt: text()
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text()
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Cards cache table - stores latest fetched cards JSON per user
export const userCardsTable = sqliteTable('user_cards', {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  // JSON string containing { matches: CardMatch[] }
  data: text().notNull(),
  createdAt: text()
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text()
    .notNull()
    .default(sql`(datetime('now'))`),
});
