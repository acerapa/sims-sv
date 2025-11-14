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

export const createBill = async (data: CreateBillData) => {
	return await db.insert(bills).values(Object(data)).returning({ lastInsertedId: bills.id });
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
