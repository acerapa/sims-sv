import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { db } from '../..';
import { invoiceItems, invoices, packages, products, salesOrders, users } from '../../schema';

interface SalesByRepRow {
	rep_name: string;
	invoice_id: number;
	invoice_date: Date;
	invoice_notes: string | null;
	item_name: string | null;
	item_quantity: number;
	item_price: string;
	item_total: string;
}

const groupBy = <K extends string | number>(
	rows: SalesByRepRow[],
	key: (row: SalesByRepRow) => K
): Map<K, SalesByRepRow[]> => {
	const grouped = new Map<K, SalesByRepRow[]>();

	for (const row of rows) {
		const keyValue = key(row);
		const existing = grouped.get(keyValue) ?? [];
		existing.push(row);
		grouped.set(keyValue, existing);
	}

	return grouped;
};

const totalAmount = (rows: SalesByRepRow[]) =>
	rows.reduce((acc, row) => acc + Number(row.item_total ?? 0), 0);

const toInvoices = (rows: SalesByRepRow[]) =>
	[...groupBy(rows, (row) => row.invoice_id).entries()]
		.map(([invoice_id, invoiceRows]) => ({
			invoice_id,
			invoice_date: invoiceRows[0].invoice_date,
			invoice_notes: invoiceRows[0].invoice_notes,
			items: invoiceRows.map((row) => ({
				item_name: row.item_name,
				item_quantity: row.item_quantity,
				item_price: row.item_price,
				item_total: row.item_total
			})),
			subtotal: totalAmount(invoiceRows),
			// Balance definition (paid vs. due, per-row vs. per-invoice) is still
			// being clarified — placeholder until then.
			balance: 0
		}))
		.sort((a, b) => a.invoice_id - b.invoice_id);

export const getSalesByRep = async (from?: string, to?: string) => {
	const result = await db
		.select({
			rep_name: users.name,
			invoice_id: invoices.id,
			invoice_date: invoices.invoice_date,
			invoice_notes: invoices.notes,
			item_name: products.sales_description || packages.name,
			item_quantity: invoiceItems.quantity,
			item_price: invoiceItems.unit_price,
			item_total: invoiceItems.total_price
		})
		.from(invoices)
		.innerJoin(salesOrders, eq(invoices.sales_order_id, salesOrders.id))
		.innerJoin(users, eq(salesOrders.staff_user_id, users.id))
		.innerJoin(invoiceItems, eq(invoiceItems.invoice_id, invoices.id))
		.leftJoin(products, eq(invoiceItems.product_id, products.id))
		.leftJoin(packages, eq(invoiceItems.package_id, packages.id))
		.where(
			and(
				ne(invoices.invoice_status, 'cancelled'),
				from ? gte(invoices.invoice_date, new Date(from)) : undefined,
				to ? lte(invoices.invoice_date, new Date(to)) : undefined
			)
		);

	const rows = result as SalesByRepRow[];

	return [...groupBy(rows, (row) => row.rep_name).entries()]
		.map(([rep_name, repRows]) => {
			const invoicesForRep = toInvoices(repRows);
			return {
				rep_name,
				invoices: invoicesForRep,
				subtotal: invoicesForRep.reduce((acc, invoice) => acc + invoice.subtotal, 0)
			};
		})
		.sort((a, b) => a.rep_name.localeCompare(b.rep_name));
};
