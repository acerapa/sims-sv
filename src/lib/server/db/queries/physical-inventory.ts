import { eq } from 'drizzle-orm';
import { db } from '..';
import { categories, physicalInventories, physicalInventoryItems, products } from '../schema';

export interface StartInventory {
	title: string;
	notes?: string | null;
	created_by: number;
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
				purchase_description: products.purchase_description,
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
		.where(eq(physicalInventories.id, id))
		.limit(1);

	return result[0];
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
