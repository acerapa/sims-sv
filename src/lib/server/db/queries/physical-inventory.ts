import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { physicalInventories, physicalInventoryItems } from '../schema';

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
	physical_inventory_id: number;
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
	const result = await db.query.physicalInventories.findFirst({
		where: eq(physicalInventories.id, id),
		columns: { id: true, title: true, status: true },
		with: {
			physicalInventoryItems: {
				with: {
					product: {
						columns: { sku: true, purchase_description: true, quantity: true },
						with: {
							category: { columns: { name: true } }
						}
					}
				}
			}
		}
	});

	if (!result) {
		throw new Error(`Physical inventory with ID ${id} not found`);
	}

	return {
		id: result.id,
		title: result.title,
		status: result.status,
		items: result.physicalInventoryItems.map((item) => ({
			id: item.id,
			product_id: item.product_id,
			sku: item.product.sku,
			purchase_description: item.product.purchase_description,
			category: item.product.category?.name ?? '',
			system_count: item.system_count,
			actual_count: item.actual_count,
			difference: item.difference
		}))
	};
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
	await db.transaction(async (tx) => {
		await tx
			.update(physicalInventories)
			.set({
				status: data.status,
				date_finalized: data.status === 'finalized' ? new Date() : null
			})
			.where(eq(physicalInventories.id, data.physical_inventory_id));

		if (!data.items.length) return;

		await tx
			.insert(physicalInventoryItems)
			.values(
				data.items.map((item) => ({
					...(item.id ? { id: item.id } : {}),
					physical_inventory_id: data.physical_inventory_id,
					product_id: item.product_id,
					system_count: item.system_count,
					actual_count: item.actual_count,
					difference: item.difference
				}))
			)
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
