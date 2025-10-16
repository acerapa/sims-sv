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
