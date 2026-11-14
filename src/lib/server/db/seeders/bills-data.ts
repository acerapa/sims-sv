import { sql } from 'drizzle-orm';
import { db, client } from '..';
import { bills, purchaseOrders } from '../schema';

// Bulk fake bills for the vendor bills list/print flow. A narrow seeder like ibrr-data:
// it only generates bill rows and reuses the data the other seeders created — each bill
// invoices the supplier and total of one linked PO, dated after that PO's receive.
// Cleanup wipes ALL bills rows: this table holds test data only.
//
// Usage: npm run seed:bills [count] — count defaults to DEFAULT_BILL_COUNT and is capped
// by the number of POs with a supplier (one bill per PO); npm run seed:bills:cleanup
const DEFAULT_BILL_COUNT = 8;

const FAKE_NOTES = [
	'Billed at the PO total',
	'Includes delivery fee agreed with the supplier',
	'Net-30 terms per supplier contract',
	'Consolidated with the previous month order'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const twoDecimals = (value: number): string => value.toFixed(2);

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_BILL_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:bills [positive-int]`);
	return count;
};

// cleanup removes every row — the table is test-data only, no markers needed
const cleanupBillData = async () => {
	const billRows = await db.delete(bills).returning({ id: bills.id });
	console.log(`Cleaned up — ${billRows.length} bills (full wipe)`);
};

const seedBillData = async (requestedCount: number) => {
	// the POs a bill can invoice — supplier and total come from the linked PO
	const [poRows, existingBill, maxBillRow] = await Promise.all([
		db
			.select({
				id: purchaseOrders.id,
				reference: purchaseOrders.reference,
				supplier_id: purchaseOrders.supplier_id,
				receive_date: purchaseOrders.receive_date,
				total: purchaseOrders.total
			})
			.from(purchaseOrders),
		db.select({ id: bills.id }).from(bills).limit(1),
		db.select({ max: sql<number>`coalesce(max(${bills.id}), 0)` }).from(bills)
	]);
	if (poRows.length === 0) throw new Error('No POs found — run npm run seed:po first');
	if (existingBill.length > 0) {
		console.log('Bill data already present — run npm run seed:bills:cleanup first');
		return;
	}

	// a bill must name the PO's supplier — POs without one can't be invoiced. Fake POs are
	// preferred so seeded bills don't cross-reference real ones
	const billablePos = poRows.filter((po) => po.supplier_id !== null);
	if (billablePos.length === 0)
		throw new Error('No POs with a supplier found — run npm run seed:po first');
	const fakeBillable = billablePos.filter((po) => po.reference.startsWith('FAKE-PO-'));
	const pool = fakeBillable.length > 0 ? fakeBillable : billablePos;

	// one bill per distinct PO (a PO is invoiced once) — up to the requested count
	if (requestedCount > pool.length)
		console.log(`Note — only ${pool.length} billable POs exist, so that is the maximum`);
	const chosenPos = [...pool].sort(() => Math.random() - 0.5).slice(0, requestedCount);

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const billIds = Array.from(
		{ length: chosenPos.length },
		(_, i) => (maxBillRow[0]?.max ?? 0) + i + 1
	);

	let paidCount = 0;
	let partialCount = 0;
	for (let i = 0; i < chosenPos.length; i++) {
		const po = chosenPos[i];
		// a bill lands a few days after the goods are received and is due 15–45 days out
		const billDate = new Date(po.receive_date.getTime() + randInt(1, 10) * 86_400_000);
		const dueDate = new Date(billDate.getTime() + randInt(15, 45) * 86_400_000);
		const total = Number(po.total);
		// most bills are settled; a third are partial with a 25/50/75% payment
		const isPaid = Math.random() < 0.66;
		const paidAmount = isPaid ? total : Number(twoDecimals(total * pick([0.25, 0.5, 0.75])));
		if (isPaid) paidCount++;
		else partialCount++;
		// a check payment carries a check number, cash never does
		const byCheck = Math.random() < 0.4;

		await db.insert(bills).values({
			id: billIds[i],
			supplier_id: po.supplier_id,
			purchase_order_id: po.id,
			bill_date: billDate,
			due_date: dueDate,
			notes: i % 2 === 0 ? pick(FAKE_NOTES) : null,
			payment_type: byCheck ? 'check' : 'cash',
			check_number: byCheck ? `CHK-${randInt(1_000_000, 9_999_999)}` : null,
			bill_status: isPaid ? 'paid' : 'partial',
			total_amount: twoDecimals(total),
			paid_amount: twoDecimals(paidAmount)
		});
	}
	console.log(
		`Bill data seeded — ${chosenPos.length} bills (${paidCount} paid, ${partialCount} partial)`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupBillData();
		} else {
			await seedBillData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in bills seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
