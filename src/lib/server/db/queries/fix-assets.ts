import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { fixAssetItems, fixAssets, products } from '../schema';
import type { FixAssetItem } from '$lib/types/global';
type FixAssetItemWithId = FixAssetItem & { id: number };

export interface CreateFixAsset {
	date_transfered: Date;
	notes?: string;
	user: string;
	staff_user_id: number;
	items: FixAssetItem[];
}

export const getFixAssets = async () => {
	return await db
		.select({
			id: fixAssets.id,
			date_transfered: fixAssets.date_transfered,
			notes: fixAssets.notes,
			user: fixAssets.user,
			items_count: count(fixAssetItems.id)
		})
		.from(fixAssets)
		.leftJoin(fixAssetItems, eq(fixAssetItems.fix_asset_id, fixAssets.id))
		.groupBy(fixAssets.id, fixAssets.date_transfered, fixAssets.notes)
		.orderBy(desc(fixAssets.created_at));
};

export const getFixAssetById = async (fixAssetId: number) => {
	const rows = await db
		.select({
			id: fixAssets.id,
			date_transfered: fixAssets.date_transfered,
			notes: fixAssets.notes,
			user: fixAssets.user,
			item_id: fixAssetItems.id,
			item_product_id: fixAssetItems.product_id,
			item_quantity: fixAssetItems.quantity,
			item_cost: fixAssetItems.cost,
			item_total_cost: fixAssetItems.total_cost,
			item_serial_number: fixAssetItems.serial_number,
			item_description: products.purchase_description
		})
		.from(fixAssets)
		.leftJoin(fixAssetItems, eq(fixAssetItems.fix_asset_id, fixAssetId))
		.leftJoin(products, eq(products.id, fixAssetItems.product_id))
		.where(eq(fixAssets.id, fixAssetId));

	if (rows.length === 0) return undefined;

	const { id, date_transfered, user, notes } = rows[0];

	const items = groupItemsByProduct(
		rows.map(
			(row) =>
				({
					id: row.item_id,
					product_id: row.item_product_id,
					quantity: row.item_quantity,
					cost: row.item_cost,
					total_cost: row.item_total_cost,
					serial_number: row.item_serial_number,
					serial_numbers: [row.item_serial_number],
					item_description: row.item_description
				}) as FixAssetItemWithId
		)
	);

	return { id, date_transfered, user, notes, items };
};

export const createFixAsset = async (data: CreateFixAsset) => {
	return await db.transaction(async (tx) => {
		const [fixAsset] = await tx
			.insert(fixAssets)
			.values(
				Object({
					date_transfered: data.date_transfered,
					notes: data.notes,
					user: data.user,
					staff_user_id: data.staff_user_id
				})
			)
			.returning({
				id: fixAssets.id
			});

		await tx.insert(fixAssetItems).values(
			data.items.map((item) =>
				Object({
					fix_asset_id: fixAsset.id,
					product_id: item.product_id,
					quantity: item.quantity,
					cost: item.cost,
					total_cost: item.total_cost,
					serial_number: item.serial_number
				})
			)
		);

		// update the products stocks
		const productsInvolved = await tx
			.select()
			.from(products)
			.where(
				inArray(
					products.id,
					data.items.map((item) => item.product_id)
				)
			);

		await Promise.all(
			data.items.map(async (item) => {
				const p = productsInvolved.find((pi) => pi.id === item.product_id);
				if (!p) {
					throw new Error(`Product with ID ${item.product_id} not found`);
				}
				return await tx
					.update(products)
					.set({ quantity: (p.quantity || 0) - item.quantity })
					.where(eq(products.id, item.product_id));
			})
		);

		return fixAsset;
	});
};

const groupItemsByProduct = (items: FixAssetItemWithId[]): FixAssetItemWithId[] => {
	const groupedItems: FixAssetItemWithId[] = [];

	for (const item of items) {
		// check if item exist in grouped items
		const itm = groupedItems.find((i) => i.product_id === item.product_id);
		if (itm) {
			itm.quantity++;
			itm.total_cost = itm.cost * itm.quantity;
			if (itm.serial_number) {
				itm.serial_numbers.push(itm.serial_number);
			}
		} else {
			groupedItems.push(item);
		}
	}

	return groupedItems;
};
