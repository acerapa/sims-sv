import { relations, sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const roles = pgEnum('role', ['admin', 'cashier', 'inventory-manager']);
export const users = pgTable('users', {
	id: serial().primaryKey(),
	email: text().notNull().unique(),
	name: text().notNull(),
	role: roles().default('cashier').notNull(),
	password: text().notNull(),
	is_active: boolean().default(true).notNull(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => sql`NOW()`)
});

export const sessions = pgTable('sessions', {
	id: serial().primaryKey(),
	user_id: serial()
		.notNull()
		.references(() => users.id),
	token: text().notNull().unique(),
	expires_at: timestamp().notNull(),
	created_at: timestamp().notNull().defaultNow()
});

// sessions and user relationship
export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.user_id],
		references: [users.id]
	})
}));

export const suppliers = pgTable('suppliers', {
	id: serial().primaryKey(),
	name: text().notNull(),
	address: text().notNull(),
	contact_person: text().notNull(),
	email: text(),
	phone_number: text(),
	telephone_number: text(),
	notes: text(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => sql`NOW()`)
});
