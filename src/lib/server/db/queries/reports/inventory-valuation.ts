import { sql } from 'drizzle-orm';
import { db } from '../..';

// Inventory Valuation Detail / Summary.
//
// Stock in this app is not ledger-based — it is reconstructed from the five
// document types that actually update products.quantity (verified in
// queries/po.ts, ibrrs.ts, strs.ts, fix-assets.ts, sales-orders.ts):
//
//   Purchase (PO received)        +   Inter-Branch Received      +
//   Stock Transfer Out (STR)      −   Fixed Asset (issued)       −
//   Sale (sales order created)    −   (package lines expanded via packages_to_products)
//
// RMAs and physical inventory counts do NOT touch stock in the current code,
// so they are intentionally excluded (approved scope decision Q2).

export interface ValuationDetailRow {
	product_id: number;
	product_sku: string;
	product_name: string;
	category_name: string;
	transaction_type: string;
	txn_date: string;
	ref_no: string;
	counterparty: string;
	quantity: number;
	unit_cost: string;
	on_hand_after: number;
	asset_value_after: string;
	current_stock: number;
	is_opening: boolean;
}

export interface ValuationSummaryRow {
	product_id: number;
	product_sku: string;
	product_name: string;
	category_name: string;
	opening: number;
	qty_in: number;
	qty_out: number;
	movement_count: number;
	ending: number;
	ending_value: string;
}

// Shared CTE: every stock movement as one row + the running on-hand balance.
// The window covers the FULL history (no date filter) so the range filter in
// the outer select only controls which rows are displayed.
const MOVEMENTS_CTE = sql`
	WITH movements AS (
		SELECT
			poi.product_id,
			po.receive_date AS txn_date,
			po.id::bigint AS doc_id,
			0::bigint AS line_id, -- purchase_order_items has no PK; per-line ordering is immaterial
			poi.quantity::bigint AS delta,
			COALESCE(poi.cost::numeric, 0) AS unit_cost,
			'Purchase' AS txn_type,
			po.reference AS ref_no,
			COALESCE(s.name, '') AS counterparty
		FROM purchase_order_items poi
		JOIN purhase_order po ON po.id = poi.purchase_order_id
		LEFT JOIN suppliers s ON s.id = po.supplier_id

		UNION ALL
		SELECT
			ibi.product_id,
			ib.received_date,
			ib.id::bigint,
			ibi.id::bigint,
			ibi.quantity::bigint,
			COALESCE(ibi.cost::numeric, 0),
			'Inter-Branch Received',
			'IBRR-' || ib.id,
			COALESCE(st.name, '')
		FROM inter_branch_receiving_report_items ibi
		JOIN inter_branch_receiving_reports ib ON ib.id = ibi.ibrr_id
		LEFT JOIN stores st ON st.id = ib.source_store_id

		UNION ALL
		SELECT
			si.product_id,
			str.transfer_date,
			str.id::bigint,
			si.id::bigint,
			-(si.quantity::bigint),
			COALESCE(si.cost::numeric, 0),
			'Stock Transfer Out',
			'STR-' || str.id,
			COALESCE(st.name, '')
		FROM str_items si
		JOIN stock_transfer_requests str ON str.id = si.str_id
		LEFT JOIN stores st ON st.id = str.store_id

		UNION ALL
		SELECT
			fai.product_id,
			fa.date_transfered,
			fa.id::bigint,
			fai.id::bigint,
			-(fai.quantity::bigint),
			COALESCE(fai.cost::numeric, 0),
			'Fixed Asset',
			'FA-' || fa.id,
			''
		FROM fix_assets_items fai
		JOIN fix_assets fa ON fa.id = fai.fix_asset_id

		UNION ALL
		SELECT
			soi.product_id,
			so.date_ordered,
			so.id::bigint,
			soi.id::bigint,
			-(soi.quantity::bigint),
			COALESCE(p.cost::numeric, 0),
			'Sale',
			'SO-' || so.id,
			COALESCE(c.name, '')
		FROM sales_order_items soi
		JOIN sales_orders so ON so.id = soi.sales_order_id
		LEFT JOIN customers c ON c.id = so.customer_id
		JOIN products p ON p.id = soi.product_id
		WHERE soi.product_id IS NOT NULL

		UNION ALL
		SELECT
			ptp.product_id,
			so.date_ordered,
			so.id::bigint,
			ptp.package_id::bigint,
			-(soi.quantity::bigint * ptp.quantity::bigint),
			COALESCE(p.cost::numeric, 0),
			'Sale',
			'SO-' || so.id,
			COALESCE(c.name, '')
		FROM sales_order_items soi
		JOIN sales_orders so ON so.id = soi.sales_order_id
		LEFT JOIN customers c ON c.id = so.customer_id
		JOIN packages_to_products ptp ON ptp.package_id = soi.package_id
		JOIN products p ON p.id = ptp.product_id
		WHERE soi.package_id IS NOT NULL AND soi.product_id IS NULL
	)
	, running AS (
		SELECT
			m.*,
			SUM(m.delta) OVER (
				PARTITION BY m.product_id
				ORDER BY m.txn_date, m.doc_id, m.line_id
				ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
			)::bigint AS on_hand
		FROM movements m
	)`;

const rangeConditions = (from?: string, to?: string, alias = 'r') => {
	const parts: ReturnType<typeof sql>[] = [];
	if (from) {
		parts.push(sql`${sql.raw(alias)}.txn_date >= ${from}::timestamp`);
	}
	if (to) {
		parts.push(sql`${sql.raw(alias)}.txn_date < (${to}::timestamp + interval '1 day')`);
	}
	return parts;
};

const productCondition = (productId?: number, alias = 'r') => {
	if (!productId) {
		return [];
	}
	return [sql`${sql.raw(alias)}.product_id = ${productId}`];
};

const whereClause = (conditions: ReturnType<typeof sql>[]) =>
	conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

export const getInventoryValuationDetail = async (
	from?: string,
	to?: string,
	productId?: number
): Promise<ValuationDetailRow[]> => {
	const detailWhere = whereClause([...rangeConditions(from, to), ...productCondition(productId)]);

	// Opening row = balance before the range; only meaningful when a range start
	// exists (an unlimited history starts at the first movement).
	const openingBlock = from
		? sql`
			UNION ALL
			SELECT
				op.product_id,
				p.sku,
				p.purchase_description,
				COALESCE(cat.name, ''),
				'Opening',
				${from}::timestamp AS txn_date,
				'' AS ref_no,
				'' AS counterparty,
				0::int AS quantity,
				COALESCE(p.cost::numeric, 0)::text AS unit_cost,
				op.qty::int AS on_hand_after,
				(op.qty * COALESCE(p.cost::numeric, 0))::text AS asset_value_after,
				p.quantity::int AS current_stock,
				true AS is_opening
			FROM (
				SELECT product_id, SUM(delta)::bigint AS qty
				FROM movements
				WHERE txn_date < ${from}::timestamp
				GROUP BY product_id
			) op
			JOIN products p ON p.id = op.product_id
			LEFT JOIN categories cat ON cat.id = p.category_id
			${whereClause(productCondition(productId, 'op'))}
		`
		: sql``;

	const result = await db.execute<ValuationDetailRow & Record<string, unknown>>(sql`
		${MOVEMENTS_CTE}
		SELECT
			r.product_id,
			p.sku AS product_sku,
			p.purchase_description AS product_name,
			COALESCE(cat.name, '') AS category_name,
			r.txn_type AS transaction_type,
			r.txn_date,
			r.ref_no,
			r.counterparty,
			r.delta::int AS quantity,
			r.unit_cost::text AS unit_cost,
			r.on_hand::int AS on_hand_after,
			(r.on_hand * COALESCE(p.cost::numeric, 0))::text AS asset_value_after,
			p.quantity::int AS current_stock,
			false AS is_opening
		FROM running r
		JOIN products p ON p.id = r.product_id
		LEFT JOIN categories cat ON cat.id = p.category_id
		${detailWhere}
		${openingBlock}
		ORDER BY product_sku, txn_date, transaction_type, ref_no
	`);

	return result as ValuationDetailRow[];
};

export const getInventoryValuationSummary = async (
	from?: string,
	to?: string,
	productId?: number
): Promise<ValuationSummaryRow[]> => {
	const windowConditions = [...rangeConditions(from, to), ...productCondition(productId, 'r')];
	const result = await db.execute<ValuationSummaryRow & Record<string, unknown>>(sql`
		${MOVEMENTS_CTE}
		SELECT
			rr.product_id,
			p.sku AS product_sku,
			p.purchase_description AS product_name,
			COALESCE(cat.name, '') AS category_name,
			MIN(rr.opening_raw)::int AS opening,
			SUM(GREATEST(rr.delta, 0))::int AS qty_in,
			SUM(-LEAST(rr.delta, 0))::int AS qty_out,
			COUNT(*)::int AS movement_count,
			MAX(rr.ending)::int AS ending,
			(MAX(rr.ending) * COALESCE(p.cost::numeric, 0))::text AS ending_value
		FROM (
			SELECT
				r.product_id,
				r.delta,
				FIRST_VALUE(r.on_hand - r.delta) OVER (
					PARTITION BY r.product_id
					ORDER BY r.txn_date, r.doc_id, r.line_id
					ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
				)::bigint AS opening_raw,
				LAST_VALUE(r.on_hand) OVER (
					PARTITION BY r.product_id
					ORDER BY r.txn_date, r.doc_id, r.line_id
					ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
				)::bigint AS ending
			FROM running r
			${whereClause(windowConditions)}
		) rr
		JOIN products p ON p.id = rr.product_id
		LEFT JOIN categories cat ON cat.id = p.category_id
		GROUP BY rr.product_id, p.sku, p.purchase_description, cat.name, p.cost
		ORDER BY p.sku
	`);

	return result as ValuationSummaryRow[];
};
