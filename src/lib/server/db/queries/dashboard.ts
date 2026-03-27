import { desc, eq, sql, sum, count, and, gt, lte } from 'drizzle-orm';
import { db } from '..';
import { customers, products, salesOrderItems, salesOrders, categories } from '../schema';

export const getRecentSalesOrders = async (limit = 5) => {
	return await db
		.select({
			id: salesOrders.id,
			customer_name: customers.name,
			date_ordered: salesOrders.date_ordered,
			order_status: salesOrders.order_status,
			total_cost: salesOrders.total_cost,
			item_count: sql<number>`(SELECT COUNT(*) FROM sales_order_items WHERE sales_order_id = ${salesOrders.id})`
		})
		.from(salesOrders)
		.leftJoin(customers, eq(salesOrders.customer_id, customers.id))
		.orderBy(desc(salesOrders.date_ordered))
		.limit(limit);
};

export const getLowStockProducts = async (limit = 5) => {
	return await db
		.select({
			id: products.id,
			sku: products.sku,
			purchase_description: products.purchase_description,
			quantity: products.quantity,
			minimum_quantity: products.minimum_quantity,
			category_name: categories.name
		})
		.from(products)
		.leftJoin(categories, eq(products.category_id, categories.id))
		.where(
			and(
				lte(products.quantity, products.minimum_quantity),
				gt(products.minimum_quantity, 0)
			)
		)
		.orderBy(sql`${products.quantity} - ${products.minimum_quantity}`)
		.limit(limit);
};

export const getTopSellingProducts = async (limit = 5) => {
	return await db
		.select({
			product_id: salesOrderItems.product_id,
			sku: products.sku,
			purchase_description: products.purchase_description,
			total_qty_sold: sum(salesOrderItems.quantity).mapWith(Number),
			total_revenue: sum(salesOrderItems.total_price).mapWith(Number)
		})
		.from(salesOrderItems)
		.innerJoin(products, eq(salesOrderItems.product_id, products.id))
		.groupBy(salesOrderItems.product_id, products.sku, products.purchase_description)
		.orderBy(desc(sum(salesOrderItems.quantity)))
		.limit(limit);
};
