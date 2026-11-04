import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db/queries/invoices', () => ({
	createInvoice: vi.fn(),
	createPayment: vi.fn(),
	getInvoice: vi.fn(),
	getCustomerBills: vi.fn().mockResolvedValue([]),
	getSalesOrderForInvoice: vi.fn()
}));

// the page server imports this module for the SO list action
vi.mock('../src/lib/server/db/queries/sales-orders', () => ({
	getSOsByCustomer: vi.fn().mockResolvedValue([])
}));

vi.mock('../src/lib/server/db/queries/customers', () => ({
	getCustomers: vi.fn().mockResolvedValue([{ id: 7, name: 'Jomar Corp' }])
}));

import {
	createInvoice,
	createPayment,
	getSalesOrderForInvoice
} from '../src/lib/server/db/queries/invoices';
import * as pageServer from '../src/routes/customers/bills/+page.server';

const invoiceDate = new Date('2026-11-09T12:00:00.000Z');
const dueDate = new Date('2026-12-09T12:00:00.000Z');
const paymentDate = new Date('2026-11-10T12:00:00.000Z');

const salesOrderForInvoice = {
	id: 42,
	customer_id: 7,
	customer_name: 'Jomar Corp',
	date_ordered: new Date('2026-11-01'),
	so_number: 'SO-42',
	subtotal: 11000,
	total_amount: 11000,
	items: [
		{
			id: 501,
			product_id: 3,
			package_id: null,
			name: 'Pump',
			quantity: 10,
			unit_price: '1000',
			invoiced_quantity: 4
		},
		{
			id: 502,
			product_id: 3,
			package_id: 9,
			name: 'Filter',
			quantity: 2,
			unit_price: '500',
			invoiced_quantity: 2
		}
	]
};

const billFields = (overrides: Record<string, string> = {}) => ({
	sales_order_id: '42',
	invoice_date: invoiceDate.toISOString(),
	due_date: dueDate.toISOString(),
	notes: '',
	paid_amount: '6000',
	payment_type: 'cash',
	check_number: '',
	reference_number: '',
	...overrides
});

const paymentFields = (overrides: Record<string, string> = {}) => ({
	invoice_id: '99',
	payment_date: paymentDate.toISOString(),
	amount: '500',
	payment_type: 'cash',
	check_number: '',
	reference_number: '',
	...overrides
});

/** Builds a POST Request whose formData() resolves to the given fields. */
const makeRequest = (fields: Record<string, string>) =>
	new Request('http://localhost/customers/bills?/createBill', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(fields).toString()
	});

const runAction = (name: 'createBill' | 'recordPayment', fields: Record<string, string>) =>
	(pageServer.actions[name] as (event: { request: Request }) => Promise<unknown>)({
		request: makeRequest(fields)
	});

describe('customer bills form actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(createInvoice).mockResolvedValue({ lastInsertedId: 99 } as never);
		vi.mocked(createPayment).mockResolvedValue({ lastInsertedId: 199 } as never);
		vi.mocked(getSalesOrderForInvoice).mockResolvedValue(salesOrderForInvoice as never);
	});

	describe('createBill', () => {
		it('creates an invoice for the remaining SO quantity and records the first payment', async () => {
			await runAction('createBill', billFields());

			expect(createInvoice).toHaveBeenCalledTimes(1);
			const [invoiceData] = vi.mocked(createInvoice).mock.calls[0];
			expect(invoiceData.sales_order_id).toBe(42);
			expect(invoiceData.total_amount).toBe(6000);
			expect(invoiceData.items).toEqual([
				expect.objectContaining({
					sales_order_item_id: 501,
					quantity: 6,
					unit_price: 1000,
					total_price: 6000
				})
			]);

			expect(createPayment).toHaveBeenCalledWith(
				expect.objectContaining({
					invoice_id: 99,
					amount: 6000,
					payment_type: 'cash'
				})
			);
		});

		it('creates an unpaid bill when no amount is paid', async () => {
			await runAction(
				'createBill',
				(() => {
					const f = billFields({ paid_amount: '0' });
					delete f.payment_type;
					return f;
				})()
			);

			expect(createInvoice).toHaveBeenCalledTimes(1);
			expect(createPayment).not.toHaveBeenCalled();
		});

		it('rejects a sales order that is already fully invoiced', async () => {
			const fullyInvoiced = {
				...salesOrderForInvoice,
				items: salesOrderForInvoice.items.map((item) => ({
					...item,
					invoiced_quantity: item.quantity
				}))
			};
			vi.mocked(getSalesOrderForInvoice).mockResolvedValue(fullyInvoiced as never);

			await expect(runAction('createBill', billFields())).resolves.toMatchObject({
				status: 400,
				data: { message: 'This sales order is already fully invoiced.' }
			});
			expect(createInvoice).not.toHaveBeenCalled();
			expect(createPayment).not.toHaveBeenCalled();
		});

		it('requires a payment type when an amount is paid', async () => {
			await expect(
				runAction('createBill', billFields({ payment_type: '' }))
			).resolves.toMatchObject({
				status: 400,
				data: { message: 'Invalid input' }
			});
			expect(createInvoice).not.toHaveBeenCalled();
		});

		it('requires a check number for check payments', async () => {
			await expect(
				runAction('createBill', billFields({ payment_type: 'check', check_number: '' }))
			).resolves.toMatchObject({ status: 400 });
			expect(createInvoice).not.toHaveBeenCalled();
		});
	});

	describe('recordPayment', () => {
		it('records a payment against the invoice', async () => {
			await runAction('recordPayment', paymentFields());

			expect(createPayment).toHaveBeenCalledWith(
				expect.objectContaining({
					invoice_id: 99,
					payment_date: paymentDate,
					amount: 500,
					payment_type: 'cash'
				})
			);
		});

		it('rejects an amount of zero', async () => {
			await expect(
				runAction('recordPayment', paymentFields({ amount: '0' }))
			).resolves.toMatchObject({ status: 400 });
			expect(createPayment).not.toHaveBeenCalled();
		});

		it('requires a check number for check payments', async () => {
			await expect(
				runAction('recordPayment', paymentFields({ payment_type: 'check', check_number: '' }))
			).resolves.toMatchObject({ status: 400 });
			expect(createPayment).not.toHaveBeenCalled();
		});
	});
});
