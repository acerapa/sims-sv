import { sql } from 'drizzle-orm';
import { db } from '../..';
import type { VbdBillRow } from '$lib/utils/vendor-balance';

/**
 * Vendor Balance Detail — raw bill facts for the ledger.
 *
 * One row per bill: a single PO can be billed many times, and each bill is an
 * independent transaction (its own date, total, and paid amount). The vendor's
 * opening balance — Σ(total − paid) over bills strictly before `from` — is
 * attached to every row so the ledger can start from the true amount owed;
 * without `from` it is '0'. Running balances are derived client-side by
 * buildVendorLedgers() (src/lib/utils/vendor-balance.ts).
 */
export const getVendorBalanceDetail = async (
	from?: string,
	to?: string,
	supplierId?: number
): Promise<VbdBillRow[]> => {
	const where: ReturnType<typeof sql>[] = [];
	if (from) where.push(sql`b.bill_date >= ${from}::timestamp`);
	if (to) where.push(sql`b.bill_date < (${to}::timestamp + interval '1 day')`);
	if (supplierId != null) where.push(sql`b.supplier_id = ${supplierId}`);
	const whereClause = where.length > 0 ? sql`WHERE ${sql.join(where, sql` AND `)}` : sql``;

	const openingJoin = from
		? sql`
				LEFT JOIN (
					SELECT supplier_id, SUM(total_amount - paid_amount)::numeric AS opening
					FROM bills
					WHERE bill_date < ${from}::timestamp
					GROUP BY supplier_id
				) ob ON ob.supplier_id = b.supplier_id
			`
		: sql``;
	const openingSelect = from
		? sql`COALESCE(ob.opening, 0)::text AS opening_balance`
		: sql`'0'::text AS opening_balance`;

	const result = await db.execute<VbdBillRow>(sql`
		SELECT
			s.id AS supplier_id,
			COALESCE(s.name, 'No Supplier') AS supplier_name,
			b.id AS bill_id,
			b.bill_date,
			po.reference AS po_reference,
			b.notes,
			b.total_amount::text AS total_amount,
			b.paid_amount::text AS paid_amount,
			${openingSelect}
		FROM bills b
		LEFT JOIN suppliers s ON b.supplier_id = s.id
		LEFT JOIN purhase_order po ON b.purchase_order_id = po.id
		${openingJoin}
		${whereClause}
		ORDER BY s.name NULLS LAST, b.bill_date, b.id
	`);

	return result as VbdBillRow[];
};
