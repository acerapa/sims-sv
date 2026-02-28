export interface PurchaseOrder {
	id: number;
	po_reference: string;
	supplier_id: number;
	date_received: Date;
	notes: string;
	items: PurchaseOrderItem[];
	discount: number;
	subtotal: number;
	total: number;
}

export interface PurchaseOrderItem {
	id: number;
	product_id: number;
	quantity: number;
	cost: number;
	total_cost: number;
}

export interface Product {
	id: number;
	purchase_description: string;
	sales_description: string;
	sale_price: number;
	item_code: string;
	category_id: number;
	quantity: number;
	minimum_quantity: number;
	cost?: number;
}

export interface Category {
	id: number;
	name: string;
	parent_id: number | null;
	sub_categories?: Category[];
}

export interface Supplier {
	id: number;
	name: string;
	email: string | null;
	notes: string | null;
	address: string;
	phone_number: string | null;
	contact_person: string;
	telephone_number: string | null;
}

export type role = 'admin' | 'cashier' | 'inventory-manager';
export interface User {
	id: number;
	name: string;
	email: string;
	role: role;
	is_active: boolean;
	password: string;
	created_at: Date;
	updated_at: Date;
}

export interface SafeUser {
	id: number;
	name: string;
	email: string;
	role: role;
	is_active: boolean;
	created_at: Date;
}

export interface SupplierPO {
	id: number;
	reference: string;
	po_items: {
		id: number;
		name: string;
		quantity: number;
		cost: number;
		total_cost: number;
	}[];
	sub_total: number;
	total: number;
	discount: number;
}

export interface Bracket {
	id?: number;
	start_price: number;
	end_price: number;
	discount_percentage: number;

	is_edited: boolean;
	is_deleted: boolean;
	original_values: {
		id: number;
		start_price: number;
		end_price: number;
		discount_percentage: number;
	} | null;
}

export interface Customer {
	name: string;
	address?: string;
	phone?: string;
	viber?: string;
	fb_account?: string;
}

export interface CustomerWithId extends Customer {
	id: number;
}

export type SalesOrderType = 'onetime' | 'installment';
export type SalesOrderStatus = 'open' | 'partially_invoiced' | 'cancelled' | 'invoiced';

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
export type InvoicePaymentType = 'cash' | 'check' | 'bank_transfer';

export interface SalesOrder {
	id: number;
	customer_id: number;
	customer_name: string;
	staff_user_id: number;
	date_ordered: Date;
	order_type: SalesOrderType;
	order_status: SalesOrderStatus;
	notes: string | null;
	total_cost: number;
	item_count: number;
	created_at: Date;
}

export interface SalesOrderWithItems extends SalesOrder {
	items: {
		id: number;
		product_id: number;
		product_name: string;
		quantity: number;
		invoiced_quantity: number;
		unit_price: number;
		total_price: number;
	}[];
}

export interface Invoice {
	id: number;
	sales_order_id: number;
	customer_name: string;
	invoice_date: Date;
	due_date: Date;
	invoice_status: InvoiceStatus;
	notes: string | null;
	total_amount: number;
	paid_amount: number;
	created_at: Date;
}

export interface InvoicePayment {
	id: number;
	invoice_id: number;
	payment_date: Date;
	amount: number;
	payment_type: InvoicePaymentType;
	check_number: string | null;
	reference_number: string | null;
	notes: string | null;
}
