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

const buildDateConditions = (from?: string, to?: string, alias = 'po', dateField = 'receive_date') => {
	const parts: ReturnType<typeof sql>[] = [];
	if (from) {
		parts.push(sql`${sql.raw(alias)}.${sql.raw(dateField)} >= ${from}::timestamp`);
	}
	if (to) {
		parts.push(sql`${sql.raw(alias)}.${sql.raw(dateField)} < (${to}::timestamp + interval '1 day')`);
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

// ─── Sales by Customer ───────────────────────────────────────────────

export interface CustomerSummaryRow {
	customer_id: number | null;
	customer_name: string;
	order_count: number;
	total_items: number;
	total_amount: string;
}

export interface CustomerDetailRow {
	customer_id: number | null;
	customer_name: string;
	order_id: number;
	date_ordered: string;
	order_status: string;
	order_total: number;
	product_sku: string;
	product_name: string;
	quantity: number;
	unit_price: string;
	total_price: string;
}

export const getSalesByCustomerSummary = async (
	from?: string,
	to?: string
): Promise<CustomerSummaryRow[]> => {
	const dateParts = buildDateConditions(from, to, 'so', 'date_ordered');
	const whereClause =
		dateParts.length > 0 ? sql`WHERE ${sql.join(dateParts, sql` AND `)}` : sql``;

	const result = await db.execute<CustomerSummaryRow>(sql`
		WITH filtered_orders AS (
			SELECT so.id, so.customer_id, so.total_cost
			FROM sales_orders so
			${whereClause}
		)
		SELECT
			c.id AS customer_id,
			COALESCE(c.name, 'Walk-in Customer') AS customer_name,
			COUNT(fo.id)::int AS order_count,
			COALESCE(SUM(item_counts.item_count), 0)::int AS total_items,
			COALESCE(SUM(fo.total_cost::numeric), 0)::text AS total_amount
		FROM filtered_orders fo
		LEFT JOIN customers c ON fo.customer_id = c.id
		LEFT JOIN (
			SELECT sales_order_id, SUM(quantity)::int AS item_count
			FROM sales_order_items
			GROUP BY sales_order_id
		) item_counts ON item_counts.sales_order_id = fo.id
		GROUP BY c.id, c.name
		ORDER BY c.name NULLS LAST
	`);

	return result as CustomerSummaryRow[];
};

// ─── Profit & Loss ────────────────────────────────────────────────

export interface ProfitLossSummaryRow {
	total_income: string;
	total_cogs: string;
	gross_profit: string;
}

export interface ProfitLossMonthlyRow {
	month: string;
	income: string;
	cogs: string;
	gross_profit: string;
}

export interface ProfitLossDetailRow {
	product_id: number;
	product_sku: string;
	product_name: string;
	quantity_sold: number;
	total_revenue: string;
	total_cost: string;
	profit: string;
}

export const getProfitLossSummary = async (
	from?: string,
	to?: string
): Promise<ProfitLossSummaryRow> => {
	const dateParts = buildDateConditions(from, to, 'i', 'invoice_date');
	const whereClause =
		dateParts.length > 0
			? sql`WHERE i.invoice_status != 'cancelled' AND ${sql.join(dateParts, sql` AND `)}`
			: sql`WHERE i.invoice_status != 'cancelled'`;

	const result = await db.execute<ProfitLossSummaryRow>(sql`
		SELECT
			COALESCE(SUM(ii.total_price::numeric), 0)::text AS total_income,
			COALESCE(SUM(ii.quantity * p.cost::numeric), 0)::text AS total_cogs,
			COALESCE(SUM(ii.total_price::numeric) - SUM(ii.quantity * p.cost::numeric), 0)::text AS gross_profit
		FROM invoices i
		INNER JOIN invoice_items ii ON i.id = ii.invoice_id
		INNER JOIN products p ON ii.product_id = p.id
		${whereClause}
	`);

	return (
		result[0] ?? {
			total_income: '0',
			total_cogs: '0',
			gross_profit: '0'
		}
	);
};

export const getProfitLossMonthly = async (
	from?: string,
	to?: string
): Promise<ProfitLossMonthlyRow[]> => {
	const dateParts = buildDateConditions(from, to, 'i', 'invoice_date');
	const whereClause =
		dateParts.length > 0
			? sql`WHERE i.invoice_status != 'cancelled' AND ${sql.join(dateParts, sql` AND `)}`
			: sql`WHERE i.invoice_status != 'cancelled'`;

	const result = await db.execute<ProfitLossMonthlyRow>(sql`
		SELECT
			TO_CHAR(i.invoice_date, 'YYYY-MM') AS month,
			COALESCE(SUM(ii.total_price::numeric), 0)::text AS income,
			COALESCE(SUM(ii.quantity * p.cost::numeric), 0)::text AS cogs,
			COALESCE(SUM(ii.total_price::numeric) - SUM(ii.quantity * p.cost::numeric), 0)::text AS gross_profit
		FROM invoices i
		INNER JOIN invoice_items ii ON i.id = ii.invoice_id
		INNER JOIN products p ON ii.product_id = p.id
		${whereClause}
		GROUP BY TO_CHAR(i.invoice_date, 'YYYY-MM')
		ORDER BY month
	`);

	return result as ProfitLossMonthlyRow[];
};

export const getProfitLossDetail = async (
	from?: string,
	to?: string
): Promise<ProfitLossDetailRow[]> => {
	const dateParts = buildDateConditions(from, to, 'i', 'invoice_date');
	const whereClause =
		dateParts.length > 0
			? sql`WHERE i.invoice_status != 'cancelled' AND ${sql.join(dateParts, sql` AND `)}`
			: sql`WHERE i.invoice_status != 'cancelled'`;

	const result = await db.execute<ProfitLossDetailRow>(sql`
		SELECT
			p.id AS product_id,
			p.sku AS product_sku,
			p.sales_description AS product_name,
			SUM(ii.quantity)::int AS quantity_sold,
			COALESCE(SUM(ii.total_price::numeric), 0)::text AS total_revenue,
			COALESCE(SUM(ii.quantity * p.cost::numeric), 0)::text AS total_cost,
			COALESCE(SUM(ii.total_price::numeric) - SUM(ii.quantity * p.cost::numeric), 0)::text AS profit
		FROM invoices i
		INNER JOIN invoice_items ii ON i.id = ii.invoice_id
		INNER JOIN products p ON ii.product_id = p.id
		${whereClause}
		GROUP BY p.id, p.sku, p.sales_description
		ORDER BY SUM(ii.total_price::numeric) - SUM(ii.quantity * p.cost::numeric) DESC
	`);

	return result as ProfitLossDetailRow[];
};

export const getSalesByCustomerDetail = async (
	from?: string,
	to?: string
): Promise<CustomerDetailRow[]> => {
	const dateParts = buildDateConditions(from, to, 'so', 'date_ordered');
	const whereClause =
		dateParts.length > 0 ? sql`WHERE ${sql.join(dateParts, sql` AND `)}` : sql``;

	const result = await db.execute<CustomerDetailRow>(sql`
		SELECT
			c.id AS customer_id,
			COALESCE(c.name, 'Walk-in Customer') AS customer_name,
			so.id AS order_id,
			so.date_ordered,
			so.order_status,
			so.total_cost AS order_total,
			p.sku AS product_sku,
			p.sales_description AS product_name,
			soi.quantity::int AS quantity,
			soi.unit_price,
			soi.total_price
		FROM sales_orders so
		LEFT JOIN customers c ON so.customer_id = c.id
		INNER JOIN sales_order_items soi ON so.id = soi.sales_order_id
		INNER JOIN products p ON soi.product_id = p.id
		${whereClause}
		ORDER BY c.name NULLS LAST, so.date_ordered DESC, so.id, p.sales_description
	`);

	return result as CustomerDetailRow[];
};
