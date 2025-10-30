import { sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const roles = pgEnum('role', ['admin', 'cashier', 'inventory-manager']);
export const users = pgTable('users', {
	id: serial().primaryKey(),
	email: text().notNull().unique(),
	name: text().notNull(),
	role: roles().default('cashier'),
	password: text().notNull(),
	is_active: boolean().default(true),
	created_at: timestamp().defaultNow(),
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
