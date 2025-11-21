import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { categories, physicalInventories, physicalInventoryItems, products } from '../schema';

export interface StartInventory {
	title: string;
	notes?: string | null;
	created_by: number;
}

export interface InventoryItem {
	id: number | null;
	physical_inventory_id: number;
	product_id: number;
	system_count: number;
	difference: number;
	actual_count: number;
}

export interface CreateInventoryItems {
	items: InventoryItem[];
	status: 'draft' | 'finalized';
}

export const startInventory = async (data: StartInventory) => {
	return await db
		.insert(physicalInventories)
		.values(Object(data))
		.returning({ lastInsertedId: physicalInventories.id });
};

export const getInventoryById = async (id: number) => {
	const result = await db
		.select({
			id: physicalInventories.id,
			title: physicalInventories.title,
			status: physicalInventories.status,
			item: {
				id: physicalInventoryItems.id,
				product_id: physicalInventoryItems.product_id,
				sku: products.sku,
				purchase_description: products.purchase_description,
				category: categories.name,
				system_count: physicalInventoryItems.system_count,
				actual_count: physicalInventoryItems.actual_count,
				difference: physicalInventoryItems.difference
			}
		})
		.from(physicalInventories)
		.leftJoin(
			physicalInventoryItems,
			eq(physicalInventoryItems.physical_inventory_id, physicalInventories.id)
		)
		.leftJoin(products, eq(products.id, physicalInventoryItems.product_id))
		.leftJoin(categories, eq(categories.id, products.category_id))
		.where(eq(physicalInventories.id, id));

	const physicalInventory = {
		id: result[0].id,
		title: result[0].title,
		status: result[0].status,
		items: result.map((inventory) => ({
			id: inventory.item.id as number,
			product_id: inventory.item.product_id as number,
			sku: inventory.item.sku as string,
			purchase_description: inventory.item.purchase_description as string,
			category: inventory.item.category as string,
			system_count: inventory.item.system_count as number,
			actual_count: inventory.item.actual_count as number,
			difference: inventory.item.difference as number
		}))
	};

	// remove items with no id
	physicalInventory.items = physicalInventory.items.filter((item) => item.id);

	return physicalInventory;
};

export const getInventories = async () => {
	return await db
		.select({
			id: physicalInventories.id,
			title: physicalInventories.title,
			created_at: physicalInventories.created_at,
			status: physicalInventories.status,
			items_counted: db.$count(
				physicalInventoryItems,
				eq(physicalInventoryItems.physical_inventory_id, physicalInventories.id)
			)
		})
		.from(physicalInventories);
};

export const upsertInventoryItems = async (data: CreateInventoryItems) => {
	const physicalInventoryId = data.items[0].physical_inventory_id;

	await db.transaction(async (tx) => {
		await tx
			.update(physicalInventories)
			.set({ status: data.status })
			.where(eq(physicalInventories.id, physicalInventoryId));

		await tx
			.insert(physicalInventoryItems)
			.values(Object(data.items))
			.onConflictDoUpdate({
				target: physicalInventoryItems.id,
				set: {
					product_id: sql`excluded.product_id`,
					system_count: sql`excluded.system_count`,
					actual_count: sql`excluded.actual_count`,
					difference: sql`excluded.difference`
				}
			});
	});
};
