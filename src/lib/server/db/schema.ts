import { relations, sql } from 'drizzle-orm';
import {
	boolean,
	decimal,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';

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

export const categories = pgTable('categories', {
	id: serial().primaryKey(),
	parent_id: integer().references((): AnyPgColumn => categories.id),
	name: varchar().notNull(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => sql`NOW()`)
});

export const products = pgTable('products', {
	id: serial().primaryKey(),
	sku: varchar().notNull().unique(),
	category_id: serial()
		.notNull()
		.references(() => categories.id),
	preferred_supplier_id: serial()
		.notNull()
		.references(() => suppliers.id),
	purchase_description: text().notNull(),
	sales_description: text().notNull(),
	sale_price: decimal().notNull(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => sql`NOW()`)
});

export const productsToSupplier = pgTable('products_to_suppliers', {
	product_id: integer()
		.notNull()
		.references(() => products.id),
	supplier_id: integer()
		.notNull()
		.references(() => suppliers.id),
	cost: decimal().notNull()
});

export const productsToCategory = pgTable('products_to_categories', {
	product_id: integer()
		.notNull()
		.references(() => products.id),
	category_id: integer()
		.notNull()
		.references(() => categories.id)
});

// relations
export const productToSupplierRelations = relations(productsToSupplier, ({ one }) => ({
	product: one(products, {
		fields: [productsToSupplier.product_id],
		references: [products.id]
	}),
	supplier: one(suppliers, {
		fields: [productsToSupplier.supplier_id],
		references: [suppliers.id]
	})
}));

export const productToCategoryRelations = relations(productsToCategory, ({ one }) => ({
	product: one(products, {
		fields: [productsToCategory.product_id],
		references: [products.id]
	}),
	category: one(categories, {
		fields: [productsToCategory.category_id],
		references: [categories.id]
	})
}));

export const productRelations = relations(products, ({ many }) => ({
	suppliers: many(productsToSupplier),
	categories: many(productsToCategory)
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
	products: many(productsToSupplier)
}));

export const categoryRelations = relations(categories, ({ many }) => ({
	products: many(productsToCategory)
}));
