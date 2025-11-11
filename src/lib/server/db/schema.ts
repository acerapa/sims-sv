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
export const receiveType = pgEnum('receive_type', ['with_pay', 'without_pay']);

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
	quantity: integer().notNull(),
	minimum_quantity: integer().default(0),
	sales_description: text().notNull(),
	sale_price: decimal().notNull(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => new Date())
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

export const purchaseOrders = pgTable('purhase_order', {
	id: serial().primaryKey(),
	reference: varchar().notNull().unique(),
	supplier_id: integer()
		.notNull()
		.references(() => suppliers.id),
	receive_date: timestamp().notNull(),
	receive_type: receiveType().notNull(),
	notes: text(),
	sub_total: decimal().notNull(),
	discount: decimal().notNull(),
	total: decimal().notNull(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => sql`NOW()`)
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
	product_id: integer()
		.notNull()
		.references(() => products.id),
	quantity: integer().notNull(),
	cost: decimal().notNull(),
	total_cost: decimal().notNull(),
	purchase_order_id: integer()
		.notNull()
		.references(() => purchaseOrders.id)
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

export const productRelations = relations(products, ({ many, one }) => ({
	productToSuppliers: many(productsToSupplier),
	category: one(categories, {
		fields: [products.category_id],
		references: [categories.id]
	}),
	preferred_supplier: one(suppliers, {
		fields: [products.preferred_supplier_id],
		references: [suppliers.id]
	})
}));

export const purchaseOrderRelations = relations(purchaseOrders, ({ one }) => ({
	supplier: one(suppliers, {
		fields: [purchaseOrders.supplier_id],
		references: [suppliers.id]
	})
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
	products: many(productsToSupplier),
	purchaseOrders: many(purchaseOrders)
}));

export const categoryRelations = relations(categories, ({ many, one }) => ({
	products: many(products),
	parent_category: one(categories, {
		fields: [categories.parent_id],
		references: [categories.id]
	})
}));
