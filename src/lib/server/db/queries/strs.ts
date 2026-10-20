import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { products, stores, strItems, strs } from '../schema';
import type { STRItem } from '$lib/types/global';

type STRItemWithId = STRItem & { id: number };

export interface CreateSTRData {
	store_id: number;
	transfer_date: Date;
	notes?: string;
	items: STRItem[];
}

export const createStr = async (data: CreateSTRData) => {
	return await db.transaction(async (tx) => {
		const [str] = await tx
			.insert(strs)
			.values(
				Object({
					store_id: data.store_id,
					transfer_date: data.transfer_date,
					notes: data.notes
				})
			)
			.returning({
				id: strs.id,
				store_id: strs.store_id,
				transfer_date: strs.transfer_date,
				notes: strs.notes
			});

		await tx.insert(strItems).values(
			data.items.map((item) => {
				return Object({
					str_id: str.id,
					product_id: item.product_id,
					quantity: item.quantity,
					cost: item.cost,
					total_cost: item.total_cost,
					serial_number: item.serial_number
				});
			})
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

		return str;
	});
};

export const getStrs = async () => {
	return await db
		.select({
			id: strs.id,
			store_id: strs.store_id,
			transfer_date: strs.transfer_date,
			notes: strs.notes,
			store_name: stores.name,
			items_count: count(strItems.id)
		})
		.from(strs)
		.leftJoin(stores, eq(stores.id, strs.store_id))
		.leftJoin(strItems, eq(strItems.str_id, strs.id))
		.groupBy(strs.id, strs.store_id, strs.transfer_date, strs.notes, strs.created_at, stores.name)
		.orderBy(desc(strs.created_at));
};

export const getStrById = async (strId: number) => {
	const rows = await db
		.select({
			id: strs.id,
			store_id: strs.store_id,
			transfer_date: strs.transfer_date,
			notes: strs.notes,
			store_name: stores.name,
			str_item_id: strItems.id,
			product_id: strItems.product_id,
			quantity: strItems.quantity,
			cost: strItems.cost,
			total_cost: strItems.total_cost,
			item_description: products.purchase_description,
			item_serial_number: strItems.serial_number
		})
		.from(strs)
		.leftJoin(stores, eq(stores.id, strs.store_id))
		.leftJoin(strItems, eq(strItems.str_id, strs.id))
		.leftJoin(products, eq(products.id, strItems.product_id))
		.where(eq(strs.id, strId));

	if (rows.length === 0) return undefined;

	const { id, store_id, transfer_date, notes, store_name } = rows[0];
	const items = groupItemsByProduct(
		rows.map(
			(row) =>
				({
					id: row.str_item_id,
					product_id: row.product_id,
					quantity: row.quantity,
					cost: row.cost,
					total_cost: row.total_cost,
					item_description: row.item_description,
					serial_number: row.item_serial_number,
					serial_numbers: [row.item_serial_number]
				}) as STRItemWithId
		)
	);

	return { id, store_id, transfer_date, notes, store_name, items_count: items.length, items };
};

const groupItemsByProduct = (items: STRItemWithId[]): STRItemWithId[] => {
	const groupedItems: STRItemWithId[] = [];

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
