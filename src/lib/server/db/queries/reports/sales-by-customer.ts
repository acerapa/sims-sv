import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../..';
import { customers, products, salesOrderItems, salesOrders, packages } from '../../schema';
import { SalesOrderStatus } from '$lib/const';

export const getSalesByCustomer = async (from?: string, to?: string) => {
	const result = await db
		.select({
			sales_order_id: salesOrders.id,
			customer_id: salesOrders.customer_id,
			customer_name: customers.name,
      date_ordered: salesOrders.date_ordered,
			order_status: salesOrders.order_status,
			item_name: products.sales_description || packages.name,
			item_quantity: salesOrderItems.quantity,
			item_total: salesOrderItems.total_price,
			item_price: salesOrderItems.unit_price
		})
		.from(salesOrders)
		.leftJoin(customers, eq(salesOrders.customer_id, customers.id))
		.leftJoin(salesOrderItems, eq(salesOrders.id, salesOrderItems.sales_order_id))
		.leftJoin(products, eq(salesOrderItems.product_id, products.id))
		.where(
			and(
				eq(salesOrders.order_status, SalesOrderStatus.INVOICED),
				from ? gte(salesOrders.date_ordered, new Date(from)) : undefined,
				to ? lte(salesOrders.date_ordered, new Date(to)) : undefined
			)
		);

	const grouped = Object.groupBy(result, (item) => item?.customer_name || '');

	const summary = Object.entries(grouped).map(([customer_name, items]) => {
		const totalOrders = items?.length
			? Object.entries(Object.groupBy(items, (item) => item.sales_order_id)).length
			: 0;

		return {
			customer_name,
			total_orders: totalOrders,
			total_items: items?.reduce((acc, item) => Number(acc) + Number(item.item_quantity), 0) || 0,
			total_sales:
				items?.reduce(
					(acc, item) => Number(acc) + Number(item.item_total ? item.item_total : 0),
					0
				) || 0
		};
	});

	const detailed = Object.entries(grouped).map(([customer_name, items]) => {
    const normalizedItems = items ? items : [];
    const groupedByOrderId = Object.groupBy(normalizedItems, (item) => item.sales_order_id);

    const formattedOrders = Object.entries(groupedByOrderId).map(([order_id, items]) => ({
      sales_order_id: order_id,
      order_status: items?.[0]?.order_status || "",
      date_ordered: items?.[0]?.date_ordered || "",
      items: items?.map((item) => ({
        product_name: item.item_name,
        item_quantity: item.item_quantity,
        item_total: item.item_total || 0,
        item_price: item.item_price || 0
      })) || [],
      subtotal: items?.reduce((acc, item) => Number(acc) + Number(item.item_total), 0)
    }))

		return {
			customer_name,
      orders: formattedOrders,
      subtotal: formattedOrders.reduce((acc, order) => Number(acc) + Number(order.subtotal), 0)
		};
	});

	return { summary, detailed };
};
