import { eq } from 'drizzle-orm';
import { db } from '..';
import { bills, purchaseOrders, suppliers } from '../schema';

export interface CreateBillData {
	supplier_id: number;
	purchase_order_id: number;
	bill_date: Date;
	due_date: Date;
	notes: string | null;
	payment_type: 'check' | 'cash';
	check_number: string | null;
	bill_status: string;
	total_amount: number;
	paid_amount: number;
}

export interface UpdateBillData extends CreateBillData {
	id: number;
}

export const createBill = async (data: CreateBillData) => {
	return await db.insert(bills).values(Object(data)).returning({ lastInsertedId: bills.id });
};

export const updateBill = async (data: UpdateBillData) => {
	const { id, ...updateData } = data;
	return await db
		.update(bills)
		.set(Object(updateData))
		.where(eq(bills.id, id))
		.returning({ id: bills.id });
};

export const getBill = async (billId: number) => {
	const result = await db
		.select({
			id: bills.id,
			supplier_id: bills.supplier_id,
			purchase_order_id: bills.purchase_order_id,
			bill_date: bills.bill_date,
			due_date: bills.due_date,
			notes: bills.notes,
			payment_type: bills.payment_type,
			check_number: bills.check_number,
			bill_status: bills.bill_status,
			total_amount: bills.total_amount,
			paid_amount: bills.paid_amount,
			supplier_name: suppliers.name,
			po_reference: purchaseOrders.reference
		})
		.from(bills)
		.leftJoin(suppliers, eq(suppliers.id, bills.supplier_id))
		.leftJoin(purchaseOrders, eq(purchaseOrders.id, bills.purchase_order_id))
		.where(eq(bills.id, billId));

	if (result.length === 0) {
		throw new Error(`Bill with ID ${billId} not found`);
	}

	return result[0];
};

export const getBills = async () => {
	return await db
		.select({
			id: bills.id,
			amount: bills.supplier_id,
			purchase_order_id: bills.purchase_order_id,
			bill_date: bills.bill_date,
			bill_status: bills.bill_status,
			due_date: bills.due_date,
			total_amount: bills.total_amount,
			paid_amount: bills.paid_amount,
			supplier_name: suppliers.name,
			po_reference: purchaseOrders.reference
		})
		.from(bills)
		.leftJoin(suppliers, eq(suppliers.id, bills.supplier_id))
		.leftJoin(purchaseOrders, eq(purchaseOrders.id, bills.purchase_order_id));
};
