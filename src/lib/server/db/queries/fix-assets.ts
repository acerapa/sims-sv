import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { fixAssetItems, fixAssets, products } from '../schema';
import type { FixAssetItem } from '$lib/types/global';

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
					.set({ quantity: (p.quantity || 0)  - item.quantity })
					.where(eq(products.id, item.product_id));
			})
		);

		return fixAsset;
	});
};
