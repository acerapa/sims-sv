import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The invoices seeder is a plain script: importing it runs main() against the real db
// module. Each test re-imports it (vi.resetModules) against a fresh in-memory db state
// and a fresh process.argv, then waits for the script to finish by watching
// client.end() — the call main() makes in its finally.
//
// Each fake invoice carries its own FAKE-INV- sales order, so the mock models the whole
// chain: orders → order items → invoices → invoice items → payments.

interface OrderFixture {
	id: number;
	customer_id: number;
	staff_user_id: number;
	date_ordered: Date;
	order_status: string;
	total_cost: number;
	sales_channel: string | null;
}
interface OrderItemFixture {
	id: number;
	sales_order_id: number;
	product_id: number;
	quantity: number;
	unit_price: string;
	total_price: string;
	serial_number: string;
}
interface InvoiceFixture {
	id: number;
	sales_order_id: number;
	invoice_date: Date;
	due_date: Date;
	invoice_status: string;
	notes: string | null;
	total_amount: string;
	paid_amount: string;
}
interface InvoiceItemFixture {
	id: number;
	invoice_id: number;
	sales_order_item_id: number;
	product_id: number;
	quantity: number;
	unit_price: string;
	total_price: string;
}
interface PaymentFixture {
	id: number;
	invoice_id: number;
	payment_date: Date;
	amount: string;
	payment_type: string;
	check_number: string | null;
	reference_number: string | null;
}
interface DbState {
	customers: { id: number; name: string }[];
	users: { id: number; name: string }[];
	products: { id: number; sale_price: string | null }[];
	orders: OrderFixture[];
	orderItems: OrderItemFixture[];
	invoices: InvoiceFixture[];
	invoiceItems: InvoiceItemFixture[];
	payments: PaymentFixture[];
}

const holder = vi.hoisted(() => ({
	state: null as unknown,
	end: null as unknown
}));

vi.mock('../src/lib/server/db', async () => {
	// pull only the bound param values out of a drizzle condition (eq → Param,
	// like → raw string chunk, inArray → raw array of values or Params) — column
	// metadata such as FK-referenced table defaults must not leak into the result
	const collectParams = (cond: unknown): (string | number)[] => {
		const chunks = (cond as { queryChunks?: unknown[] } | undefined)?.queryChunks;
		if (!chunks) return [];
		const out: (string | number)[] = [];
		for (const chunk of chunks) {
			if (typeof chunk === 'string' || typeof chunk === 'number') {
				out.push(chunk);
			} else if (Array.isArray(chunk)) {
				for (const v of chunk) {
					if (typeof v === 'string' || typeof v === 'number') out.push(v);
					else if (v && typeof v === 'object' && 'value' in (v as object)) {
						const inner = (v as { value: unknown }).value;
						if (typeof inner === 'string' || typeof inner === 'number') out.push(inner);
					}
				}
			} else if (chunk && typeof chunk === 'object' && 'value' in (chunk as object)) {
				const v = (chunk as { value: unknown }).value;
				if (typeof v === 'string' || typeof v === 'number') out.push(v);
			}
		}
		return out;
	};

	const { getTableName } = await import('drizzle-orm');

	const answer = (c: Record<string, unknown>): unknown => {
		const state = holder.state as DbState;
		if (c.kind === 'insert') {
			const table = getTableName(c.table as never);
			const rows = (Array.isArray(c._values) ? c._values : [c._values]) as Record<
				string,
				unknown
			>[];
			const target =
				table === 'sales_orders'
					? state.orders
					: table === 'sales_order_items'
						? state.orderItems
						: table === 'invoices'
							? state.invoices
							: table === 'invoice_items'
								? state.invoiceItems
								: table === 'invoice_payments'
									? state.payments
									: null;
			if (!target) throw new Error(`Unexpected insert target in invoices seeder test: ${table}`);
			for (const row of rows) target.push(row as never);
			return [];
		}
		if (c.kind === 'delete') {
			const table = getTableName(c.table as never);
			const ids = collectParams(c._cond).filter((v): v is number => typeof v === 'number');
			if (table === 'invoice_payments') {
				state.payments = state.payments.filter((r) => !ids.includes(r.invoice_id));
			} else if (table === 'invoice_items') {
				state.invoiceItems = state.invoiceItems.filter((r) => !ids.includes(r.invoice_id));
			} else if (table === 'invoices') {
				state.invoices = state.invoices.filter((r) => !ids.includes(r.id));
			} else if (table === 'sales_order_items') {
				state.orderItems = state.orderItems.filter((r) => !ids.includes(r.id));
			} else if (table === 'sales_orders') {
				state.orders = state.orders.filter((r) => !ids.includes(r.id));
			} else {
				throw new Error(`Unexpected delete target in invoices seeder test: ${table}`);
			}
			return [];
		}
		// select
		const table = getTableName(c.fromTable as never);
		const keys = Object.keys(c.fields as Record<string, unknown>);
		const limit = (c._limit as number | undefined) ?? Infinity;
		const params = c._cond ? collectParams(c._cond) : [];
		if (table === 'customers') return state.customers.map((r) => ({ id: r.id }));
		if (table === 'users') return state.users.map((r) => ({ id: r.id }));
		if (table === 'products') return [...state.products].sort((a, b) => a.id - b.id);
		if (keys.includes('max')) {
			const rows =
				table === 'sales_orders'
					? state.orders
					: table === 'sales_order_items'
						? state.orderItems
						: table === 'invoices'
							? state.invoices
							: table === 'invoice_items'
								? state.invoiceItems
								: state.payments;
			return [{ max: rows.reduce((m, r) => Math.max(m, (r as { id: number }).id), 0) }];
		}
		if (table === 'sales_order_items' && params.includes('FAKE-INV-%')) {
			return state.orderItems
				.filter((r) => r.serial_number.startsWith('FAKE-INV-'))
				.map((r) => ({ id: r.id, sales_order_id: r.sales_order_id }))
				.slice(0, limit);
		}
		if (table === 'invoice_items') {
			return state.invoiceItems
				.filter((r) => params.includes(r.sales_order_item_id))
				.map((r) => ({ invoice_id: r.invoice_id }))
				.slice(0, limit);
		}
		if (table === 'sales_orders' && c._grouped) {
			// the cleanup's empty-order check: affected orders left without items
			return state.orders
				.filter(
					(o) => params.includes(o.id) && !state.orderItems.some((i) => i.sales_order_id === o.id)
				)
				.map((o) => ({ id: o.id }));
		}
		throw new Error(`Unexpected select in invoices seeder test: ${table} keys=${keys.join(',')}`);
	};

	const makeChain = (kind: 'select' | 'insert' | 'delete', fieldsOrTable: unknown) => {
		const self: Record<string, unknown> = {
			kind,
			fields: kind === 'select' ? fieldsOrTable : undefined,
			table: kind !== 'select' ? fieldsOrTable : undefined,
			fromTable: undefined,
			_grouped: false,
			_cond: undefined,
			_values: undefined,
			_limit: undefined,
			from: (t: unknown) => {
				self.fromTable = t;
				return self;
			},
			innerJoin: () => self,
			leftJoin: () => self,
			orderBy: () => self,
			groupBy: () => {
				self._grouped = true;
				return self;
			},
			having: () => self,
			limit: (n: number) => {
				self._limit = n;
				return self;
			},
			where: (cond: unknown) => {
				self._cond = cond;
				return self;
			},
			values: (v: unknown) => {
				self._values = v;
				return self;
			},
			then: (res: (v: unknown) => void, rej: (e: unknown) => void) => {
				Promise.resolve()
					.then(() => answer(self))
					.then(res)
					.catch(rej);
			}
		};
		return self;
	};

	return {
		db: {
			select: (fields: unknown) => makeChain('select', fields),
			insert: (table: unknown) => makeChain('insert', table),
			delete: (table: unknown) => makeChain('delete', table)
		},
		client: {
			end: () => (holder.end as () => void)?.()
		}
	};
});

// exactly three products (the seeder's minimum), all priced so invoice totals stay > 0
// (keeps the payment-mix counts deterministic); NULL sale prices get their own test
const baseProducts = () => [
	{ id: 1, sale_price: '10000' },
	{ id: 2, sale_price: '2500.50' },
	{ id: 3, sale_price: '7500' }
];

const baseState = (): DbState => ({
	customers: [
		{ id: 1, name: 'Walk-in Customer' },
		{ id: 2, name: 'Jomar Corp' }
	],
	users: [{ id: 1, name: 'Admin' }],
	products: baseProducts(),
	orders: [],
	orderItems: [],
	invoices: [],
	invoiceItems: [],
	payments: []
});

const realArgv = process.argv;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.resetModules();
	holder.state = baseState();
	holder.end = vi.fn();
	process.exitCode = undefined;
	logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	process.argv = realArgv;
});

const runSeeder = async (...argv: string[]) => {
	process.argv = ['node', 'seed:invoices', ...argv];
	await import('../src/lib/server/db/seeders/invoices-data');
	await vi.waitFor(() => expect(holder.end).toHaveBeenCalled());
};

const state = (): DbState => holder.state as DbState;
const itemsForOrder = (orderId: number) =>
	state().orderItems.filter((i) => i.sales_order_id === orderId);
const itemsForInvoice = (invoiceId: number) =>
	state().invoiceItems.filter((i) => i.invoice_id === invoiceId);
const paymentsFor = (invoiceId: number) =>
	state().payments.filter((p) => p.invoice_id === invoiceId);

describe('invoices seeder — happy path', () => {
	it('seeds one invoice per run unit, each with its own FAKE-INV- sales order', async () => {
		await runSeeder('4');

		expect(state().invoices).toHaveLength(4);
		expect(state().orders).toHaveLength(4);
		const orderIds = new Set(state().invoices.map((i) => i.sales_order_id));
		expect(orderIds.size).toBe(4);
		for (const order of state().orders) {
			const items = itemsForOrder(order.id);
			expect(items.length).toBeGreaterThanOrEqual(1);
			expect(items.length).toBeLessThanOrEqual(3);
			expect(new Set(items.map((i) => i.product_id)).size).toBe(items.length);
			for (const item of items) expect(item.serial_number).toMatch(/^FAKE-INV-\d{3}-\d+$/);
		}
	});

	it('keeps order, invoice, and item money consistent', async () => {
		await runSeeder('4');

		for (const order of state().orders) {
			const items = itemsForOrder(order.id);
			const itemSum = items.reduce((sum, i) => sum + Number(i.total_price), 0);
			expect(Math.abs(order.total_cost - Math.round(itemSum))).toBeLessThanOrEqual(1);
			const invoice = state().invoices.find((i) => i.sales_order_id === order.id);
			expect(invoice).toBeDefined();
			const invoiceItems = itemsForInvoice(invoice!.id);
			expect(invoiceItems).toHaveLength(items.length);
			const invoiceSum = invoiceItems.reduce((sum, i) => sum + Number(i.total_price), 0);
			expect(Math.abs(Number(invoice!.total_amount) - invoiceSum)).toBeLessThan(0.01);
		}
	});

	it('prices items from the product sale price and mirrors them onto the invoice', async () => {
		await runSeeder('4');

		for (const order of state().orders) {
			const items = itemsForOrder(order.id);
			const invoice = state().invoices.find((i) => i.sales_order_id === order.id)!;
			const invoiceItems = itemsForInvoice(invoice.id);
			for (let i = 0; i < items.length; i++) {
				const product = state().products.find((p) => p.id === items[i].product_id);
				const expectedPrice = String(Number(product?.sale_price ?? '0'));
				expect(items[i].unit_price).toBe(expectedPrice);
				expect(items[i].total_price).toBe(
					String(Number(product?.sale_price ?? '0') * items[i].quantity)
				);
				// invoice rows mirror the order rows, 1:1, in order
				expect(invoiceItems[i].sales_order_item_id).toBe(items[i].id);
				expect(invoiceItems[i].product_id).toBe(items[i].product_id);
				expect(invoiceItems[i].quantity).toBe(items[i].quantity);
				expect(invoiceItems[i].unit_price).toBe(items[i].unit_price);
				expect(invoiceItems[i].total_price).toBe(items[i].total_price);
			}
		}
	});

	it('treats a NULL sale price as zero for item and invoice totals', async () => {
		(state() as DbState).products = [
			{ id: 1, sale_price: null },
			{ id: 2, sale_price: null },
			{ id: 3, sale_price: null }
		];
		await runSeeder('4');

		for (const item of state().orderItems) {
			expect(item.unit_price).toBe('0');
			expect(item.total_price).toBe('0');
		}
		for (const invoice of state().invoices) {
			expect(invoice.total_amount).toBe('0');
		}
	});

	it('applies the payment mix: seq 1,4,7,10 paid; 2,5,8 partially paid; 3,6,9 unpaid', async () => {
		await runSeeder('10');

		const paid = state().invoices.filter((i) => i.invoice_status === 'paid');
		const partial = state().invoices.filter((i) => i.invoice_status === 'partially_paid');
		const unpaid = state().invoices.filter((i) => i.invoice_status === 'unpaid');
		expect(paid).toHaveLength(4);
		expect(partial).toHaveLength(3);
		expect(unpaid).toHaveLength(3);

		for (const invoice of paid) {
			expect(Number(invoice.paid_amount)).toBe(Number(invoice.total_amount));
			expect(paymentsFor(invoice.id)).toHaveLength(1);
		}
		for (const invoice of partial) {
			const paidAmount = Number(invoice.paid_amount);
			expect(paidAmount).toBeGreaterThan(0);
			expect(paidAmount).toBeLessThan(Number(invoice.total_amount));
			expect(paymentsFor(invoice.id)).toHaveLength(1);
		}
		for (const invoice of unpaid) {
			expect(invoice.paid_amount).toBe('0');
			expect(paymentsFor(invoice.id)).toHaveLength(0);
		}
	});

	it('keeps paid_amount equal to the sum of payments for every invoice', async () => {
		await runSeeder('10');

		for (const invoice of state().invoices) {
			const sum = paymentsFor(invoice.id).reduce((s, p) => s + Number(p.amount), 0);
			expect(Math.abs(Number(invoice.paid_amount) - sum)).toBeLessThan(0.01);
		}
	});

	it('sets due_date 15 days after the recent invoice date', async () => {
		await runSeeder('4');

		for (const invoice of state().invoices) {
			expect(invoice.due_date.getTime() - invoice.invoice_date.getTime()).toBe(15 * 86_400_000);
			expect(invoice.invoice_date.getTime()).toBeGreaterThan(Date.now() - 61 * 86_400_000);
		}
	});

	it('matches payment reference fields to the payment type', async () => {
		await runSeeder('10');

		for (const payment of state().payments) {
			if (payment.payment_type === 'check') {
				expect(payment.check_number).toMatch(/^CHK-\d+$/);
				expect(payment.reference_number).toBeNull();
			} else if (payment.payment_type === 'bank_transfer') {
				expect(payment.reference_number).toMatch(/^BTR-\d+$/);
				expect(payment.check_number).toBeNull();
			} else {
				expect(payment.check_number).toBeNull();
				expect(payment.reference_number).toBeNull();
			}
		}
	});

	it('marks every order invoiced and points at real customers and users', async () => {
		await runSeeder('4');

		for (const order of state().orders) {
			expect(order.order_status).toBe('invoiced');
			expect(state().customers.some((c) => c.id === order.customer_id)).toBe(true);
			expect(state().users.some((u) => u.id === order.staff_user_id)).toBe(true);
		}
	});

	it('allocates explicit ids above the highest existing row of each table', async () => {
		(state().orders as OrderFixture[]).push({
			id: 20,
			customer_id: 1,
			staff_user_id: 1,
			date_ordered: new Date(),
			order_status: 'open',
			total_cost: 100,
			sales_channel: null
		});
		(state().invoices as InvoiceFixture[]).push({
			id: 40,
			sales_order_id: 20,
			invoice_date: new Date(),
			due_date: new Date(),
			invoice_status: 'unpaid',
			notes: null,
			total_amount: '100',
			paid_amount: '0'
		});
		await runSeeder('4');

		expect(
			state()
				.orders.filter((o) => o.id > 20)
				.map((o) => o.id)
		).toEqual([21, 22, 23, 24]);
		expect(
			state()
				.invoices.filter((i) => i.id > 40)
				.map((i) => i.id)
		).toEqual([41, 42, 43, 44]);
	});

	it('uses the default count of 10 when no count argument is given', async () => {
		await runSeeder();

		expect(state().invoices).toHaveLength(10);
		expect(state().orders).toHaveLength(10);
	});
});

describe('invoices seeder — fail-fast and idempotency', () => {
	it('fails fast with a hint when no customers exist', async () => {
		(state() as DbState).customers = [];
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in invoice seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining(
					'No customers found — run npm run seed:walk-in-customer first'
				)
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().orders).toHaveLength(0);
	});

	it('fails fast with a hint when no users exist', async () => {
		(state() as DbState).users = [];
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in invoice seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining('No users found — run npm run seed:admin-user first')
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().orders).toHaveLength(0);
	});

	it('fails fast with a hint when no products exist', async () => {
		(state() as DbState).products = [];
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in invoice seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining(
					'No products found — run npm run seed:fake-data or seed:str first'
				)
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().orders).toHaveLength(0);
	});

	it('fails fast when there are fewer than three products, without writing anything', async () => {
		(state() as DbState).products = baseProducts().slice(0, 2);
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in invoice seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining('Need at least 3 distinct products')
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().orders).toHaveLength(0);
		expect(state().invoices).toHaveLength(0);
	});

	it('refuses to re-seed when FAKE-INV- order items already exist', async () => {
		(state().orderItems as OrderItemFixture[]).push({
			id: 1,
			sales_order_id: 1,
			product_id: 1,
			quantity: 1,
			unit_price: '100',
			total_price: '100',
			serial_number: 'FAKE-INV-001-1'
		});
		await runSeeder('10');

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Fake invoice data already present — run npm run seed:invoices:cleanup first'
			)
		);
		expect(state().invoices).toHaveLength(0);
		expect(state().payments).toHaveLength(0);
	});

	it('rejects a non-numeric count without touching the database', async () => {
		await runSeeder('abc');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in invoice seeder script:'),
			expect.objectContaining({ message: expect.stringContaining('Invalid count "abc"') })
		);
		expect(process.exitCode).toBe(1);
		expect(state().orders).toHaveLength(0);
	});
});

describe('invoices seeder — cleanup', () => {
	const realChain = (): Partial<DbState> => ({
		orders: [
			{
				id: 1,
				customer_id: 1,
				staff_user_id: 1,
				date_ordered: new Date(),
				order_status: 'invoiced',
				total_cost: 100,
				sales_channel: null
			}
		],
		orderItems: [
			{
				id: 1,
				sales_order_id: 1,
				product_id: 1,
				quantity: 1,
				unit_price: '100',
				total_price: '100',
				serial_number: 'REAL-1'
			}
		],
		invoices: [
			{
				id: 1,
				sales_order_id: 1,
				invoice_date: new Date(),
				due_date: new Date(),
				invoice_status: 'unpaid',
				notes: null,
				total_amount: '100',
				paid_amount: '0'
			}
		],
		invoiceItems: [
			{
				id: 1,
				invoice_id: 1,
				sales_order_item_id: 1,
				product_id: 1,
				quantity: 1,
				unit_price: '100',
				total_price: '100'
			}
		]
	});

	const fakeChain = (): Partial<DbState> => ({
		orders: [
			{
				id: 2,
				customer_id: 1,
				staff_user_id: 1,
				date_ordered: new Date(),
				order_status: 'invoiced',
				total_cost: 200,
				sales_channel: null
			}
		],
		orderItems: [
			{
				id: 2,
				sales_order_id: 2,
				product_id: 1,
				quantity: 2,
				unit_price: '100',
				total_price: '200',
				serial_number: 'FAKE-INV-001-1'
			}
		],
		invoices: [
			{
				id: 2,
				sales_order_id: 2,
				invoice_date: new Date(),
				due_date: new Date(),
				invoice_status: 'paid',
				notes: null,
				total_amount: '200',
				paid_amount: '200'
			}
		],
		invoiceItems: [
			{
				id: 2,
				invoice_id: 2,
				sales_order_item_id: 2,
				product_id: 1,
				quantity: 2,
				unit_price: '100',
				total_price: '200'
			}
		],
		payments: [
			{
				id: 1,
				invoice_id: 2,
				payment_date: new Date(),
				amount: '200',
				payment_type: 'cash',
				check_number: null,
				reference_number: null
			}
		]
	});

	const mergedState = (): DbState => {
		const s = state();
		s.orders = [
			...(realChain().orders as OrderFixture[]),
			...(fakeChain().orders as OrderFixture[])
		];
		s.orderItems = [
			...(realChain().orderItems as OrderItemFixture[]),
			...(fakeChain().orderItems as OrderItemFixture[])
		];
		s.invoices = [
			...(realChain().invoices as InvoiceFixture[]),
			...(fakeChain().invoices as InvoiceFixture[])
		];
		s.invoiceItems = [
			...(realChain().invoiceItems as InvoiceItemFixture[]),
			...(fakeChain().invoiceItems as InvoiceItemFixture[])
		];
		s.payments = [...(fakeChain().payments as PaymentFixture[])];
		return s;
	};

	it('removes the whole FAKE chain (payments, invoice items, invoices, order items, orders) and keeps real rows', async () => {
		mergedState();
		await runSeeder('cleanup');

		expect(state().orders.map((o) => o.id)).toEqual([1]);
		expect(state().orderItems.map((i) => i.id)).toEqual([1]);
		expect(state().invoices.map((i) => i.id)).toEqual([1]);
		expect(state().invoiceItems.map((i) => i.id)).toEqual([1]);
		expect(state().payments).toHaveLength(0);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 1 fake invoices, 1 fake order items, 1 fake orders (orders deleted only when fully fake)'
		);
	});

	it('keeps a FAKE order the user extended with a real item', async () => {
		mergedState();
		(state() as DbState).orderItems.push({
			id: 3,
			sales_order_id: 2,
			product_id: 2,
			quantity: 1,
			unit_price: '10',
			total_price: '10',
			serial_number: 'REAL-EXTENDED'
		});
		await runSeeder('cleanup');

		// order 2 survives (it has a real item left); its fake invoice chain is gone
		expect(state().orders.map((o) => o.id)).toEqual([1, 2]);
		expect(
			state()
				.orderItems.map((i) => i.id)
				.sort((a, b) => a - b)
		).toEqual([1, 3]);
		expect(state().invoices.map((i) => i.id)).toEqual([1]);
		expect(state().payments).toHaveLength(0);
	});

	it('is a no-op when no FAKE-INV- order items exist', async () => {
		(state() as DbState).orders = realChain().orders as OrderFixture[];
		(state() as DbState).orderItems = realChain().orderItems as OrderItemFixture[];
		await runSeeder('cleanup');

		expect(state().orders).toHaveLength(1);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 0 fake invoices and their chain (real rows untouched)'
		);
	});
});
