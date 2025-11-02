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
	unit_cost: number;
	total_cost: number;
}

export interface Product {
	id: number;
	purchase_item_description: string;
	sales_item_description: string;
	price: number;
	item_code: string;
	category_id: number;
	stocks: number;
	minimum_stock: number;
}

export interface Category {
	id: number;
	name: string;
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
