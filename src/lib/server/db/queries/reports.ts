import { sql } from 'drizzle-orm';
import { db } from '..';

export interface VendorSummaryRow {
	supplier_id: number | null;
	supplier_name: string;
	po_count: number;
	total_items: number;
	total_amount: string;
}

export interface VendorDetailRow {
	supplier_id: number | null;
	supplier_name: string;
	po_id: number;
	po_reference: string;
	receive_date: string;
	po_total: string;
	product_sku: string;
	product_name: string;
	quantity: number;
	cost: string;
	total_cost: string;
}

const buildDateConditions = (from?: string, to?: string, alias = 'po') => {
	const parts: ReturnType<typeof sql>[] = [];
	if (from) {
		parts.push(sql`${sql.raw(alias)}.receive_date >= ${from}::timestamp`);
	}
	if (to) {
		parts.push(sql`${sql.raw(alias)}.receive_date < (${to}::timestamp + interval '1 day')`);
	}
	return parts;
};

export const getPurchasesByVendorSummary = async (
	from?: string,
	to?: string
): Promise<VendorSummaryRow[]> => {
	const dateParts = buildDateConditions(from, to);
	const whereClause =
		dateParts.length > 0 ? sql`WHERE ${sql.join(dateParts, sql` AND `)}` : sql``;

	const result = await db.execute<VendorSummaryRow>(sql`
		WITH filtered_pos AS (
			SELECT po.id, po.supplier_id, po.total
			FROM purhase_order po
			${whereClause}
		)
		SELECT
			s.id AS supplier_id,
			COALESCE(s.name, 'No Supplier') AS supplier_name,
			COUNT(fp.id)::int AS po_count,
			COALESCE(SUM(item_counts.item_count), 0)::int AS total_items,
			COALESCE(SUM(fp.total::numeric), 0)::text AS total_amount
		FROM filtered_pos fp
		LEFT JOIN suppliers s ON fp.supplier_id = s.id
		LEFT JOIN (
			SELECT purchase_order_id, SUM(quantity)::int AS item_count
			FROM purchase_order_items
			GROUP BY purchase_order_id
		) item_counts ON item_counts.purchase_order_id = fp.id
		GROUP BY s.id, s.name
		ORDER BY s.name NULLS LAST
	`);

	return result as VendorSummaryRow[];
};

export const getPurchasesByVendorDetail = async (
	from?: string,
	to?: string
): Promise<VendorDetailRow[]> => {
	const dateParts = buildDateConditions(from, to);
	const whereClause =
		dateParts.length > 0 ? sql`WHERE ${sql.join(dateParts, sql` AND `)}` : sql``;

	const result = await db.execute<VendorDetailRow>(sql`
		SELECT
			s.id AS supplier_id,
			COALESCE(s.name, 'No Supplier') AS supplier_name,
			po.id AS po_id,
			po.reference AS po_reference,
			po.receive_date,
			po.total AS po_total,
			p.sku AS product_sku,
			p.purchase_description AS product_name,
			poi.quantity::int AS quantity,
			poi.cost,
			poi.total_cost
		FROM purhase_order po
		LEFT JOIN suppliers s ON po.supplier_id = s.id
		INNER JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
		INNER JOIN products p ON poi.product_id = p.id
		${whereClause}
		ORDER BY s.name NULLS LAST, po.receive_date DESC, po.id, p.purchase_description
	`);

	return result as VendorDetailRow[];
};
