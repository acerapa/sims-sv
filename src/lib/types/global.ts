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
