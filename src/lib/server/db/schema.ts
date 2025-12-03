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
export const billStatus = pgEnum('bill_status', ['partial', 'paid']);
export const billPaymentType = pgEnum('bill_payment_type', ['cash', 'check']);
export const physicalInventoryStatus = pgEnum('physical_inventory_status', ['draft', 'finalized']);

const timestamps = {
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => sql`NOW()`)
};

export const users = pgTable('users', {
	id: serial().primaryKey(),
	email: text().notNull().unique(),
	name: text().notNull(),
	role: roles().default('cashier').notNull(),
	password: text().notNull(),
	is_active: boolean().default(true).notNull(),
	...timestamps
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
	...timestamps
});

export const categories = pgTable('categories', {
	id: serial().primaryKey(),
	parent_id: integer().references((): AnyPgColumn => categories.id),
	name: varchar().notNull(),
	...timestamps
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
	...timestamps
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
	...timestamps
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

export const bills = pgTable('bills', {
	id: serial().primaryKey(),
	supplier_id: integer()
		.notNull()
		.references(() => suppliers.id),
	purchase_order_id: integer()
		.notNull()
		.references(() => purchaseOrders.id),
	notes: text(),
	bill_date: timestamp().notNull(),
	bill_status: billStatus().notNull(),
	payment_type: billPaymentType().notNull(),
	check_number: varchar(),
	due_date: timestamp().notNull(),
	total_amount: decimal().notNull(),
	paid_amount: decimal().notNull(),
	...timestamps
});

export const physicalInventories = pgTable('physical_inventory', {
	id: serial().primaryKey(),
	title: varchar().notNull(),
	notes: text(),
	status: physicalInventoryStatus().default('draft'),
	date_finalized: timestamp(),
	created_by: integer()
		.notNull()
		.references(() => users.id),
	...timestamps
});

export const physicalInventoryItems = pgTable('physical_inventory_items', {
	id: serial().primaryKey(),
	physical_inventory_id: integer()
		.notNull()
		.references(() => physicalInventories.id),
	product_id: integer()
		.notNull()
		.references(() => products.id),
	system_count: integer().notNull(),
	actual_count: integer().notNull(),
	difference: integer().notNull(),
	...timestamps
});

export const stores = pgTable('stores', {
	id: serial().primaryKey(),
	name: varchar().notNull(),
	manager: integer()
		.notNull()
		.references(() => users.id),
	address: varchar().notNull(),
	phone_number: varchar().notNull(),
	is_active: boolean().default(true),
	...timestamps
});

export const strs = pgTable('stock_transfer_requests', {
	id: serial().primaryKey(),
	store_id: integer()
		.notNull()
		.references(() => stores.id),
	transfer_date: timestamp().notNull(),
	notes: text(),
	...timestamps
});

export const strItems = pgTable('str_items', {
	id: serial().primaryKey(),
	product_id: integer()
		.notNull()
		.references(() => products.id),
	quantity: integer().notNull(),
	cost: integer().notNull(),
	total_cost: integer().notNull()
});

// relations
export const strRelations = relations(strs, ({ one }) => ({
	detination: one(stores, {
		fields: [strs.store_id],
		references: [stores.id]
	})
}));

export const storeRelations = relations(stores, ({ one, many }) => ({
	manager: one(users, {
		fields: [stores.manager],
		references: [users.id]
	}),
	strs: many(strs)
}));

export const physicalInventoryItemsRelations = relations(physicalInventoryItems, ({ one }) => ({
	physicalInventory: one(physicalInventories, {
		fields: [physicalInventoryItems.physical_inventory_id],
		references: [physicalInventories.id]
	}),
	product: one(products, {
		fields: [physicalInventoryItems.product_id],
		references: [products.id]
	})
}));

export const physicalInventoriesRelations = relations(physicalInventories, ({ many, one }) => ({
	physicalInventoryItems: many(physicalInventoryItems),
	created_by: one(users, {
		fields: [physicalInventories.created_by],
		references: [users.id]
	})
}));

export const billRelations = relations(bills, ({ one }) => ({
	supplier: one(suppliers, {
		fields: [bills.supplier_id],
		references: [suppliers.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [bills.purchase_order_id],
		references: [purchaseOrders.id]
	})
}));

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

export const purchaseOrderRelations = relations(purchaseOrders, ({ one, many }) => ({
	supplier: one(suppliers, {
		fields: [purchaseOrders.supplier_id],
		references: [suppliers.id]
	}),
	bills: many(bills)
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
	products: many(productsToSupplier),
	purchaseOrders: many(purchaseOrders),
	bills: many(bills)
}));

export const categoryRelations = relations(categories, ({ many, one }) => ({
	products: many(products),
	parent_category: one(categories, {
		fields: [categories.parent_id],
		references: [categories.id]
	})
}));
