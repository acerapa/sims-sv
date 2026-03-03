import type { Bracket } from '$lib/types/global';
import { eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '..';
import { products, sellingBrackets } from '../schema';

export const getSellingBrackets = async () => {
	return await db.select().from(sellingBrackets);
};

export const getBracketProducts = async () => {
	return await db
		.select({
			id: products.id,
			sku: products.sku,
			sales_description: products.sales_description,
			cost: products.cost,
			sale_price: products.sale_price,
			selling_bracket_id: products.selling_bracket_id
		})
		.from(products)
		.where(isNotNull(products.selling_bracket_id));
};

export const updateCreateSellingBrackets = async (data: Bracket[]) => {
	if (!data.length) return;

	const tobeDeleted = data.filter((bracket) => bracket.is_deleted && bracket.id !== null);
	const toAddOrUpdate = data.filter((bracket) => !bracket.is_deleted);

	return await db.transaction(async (trx) => {
		if (tobeDeleted.length) {
			await trx
				.delete(sellingBrackets)
				.where(
					inArray(
						sellingBrackets.id,
						tobeDeleted.map((bracket) => bracket.id).filter((id) => id && id !== null) as number[]
					)
				);
		}

		if (toAddOrUpdate.length) {
			await trx
				.insert(sellingBrackets)
				.values(
					toAddOrUpdate.map((bracket) => ({
						id: bracket.id ?? undefined,
						start_price: bracket.start_price,
						end_price: bracket.end_price,
						discount_percentage: bracket.discount_percentage
					}))
				)
				.onConflictDoUpdate({
					target: sellingBrackets.id,
					set: {
						start_price: sql.raw(`excluded.start_price`),
						end_price: sql.raw(`excluded.end_price`),
						discount_percentage: sql.raw(`excluded.discount_percentage`)
					}
				});
		}
	});
};
