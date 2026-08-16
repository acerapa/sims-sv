import { desc, eq, sql, count, sum, and, gte, lt } from 'drizzle-orm';
import { db } from '..';
import { customers, products, salesOrderItems, salesOrders, users, packagesToProducts, packages } from '../schema';

export interface CreateSalesOrder {
	customer_id: number;
	staff_user_id: number;
	date_ordered: Date;
	order_type: string;
	notes?: string;
	total_cost: number;
	products: {
		product_id?: number | null;
		package_id?: number | null;
		quantity: number;
		unit_price: number;
		total_price: number;
		serial_number?: string;
	}[];
}

export const createSalesOrder = async (data: CreateSalesOrder) => {
	return await db.transaction(async (tx) => {
		const [order] = await tx
			.insert(salesOrders)
			.values(
				Object({
					customer_id: data.customer_id,
					staff_user_id: data.staff_user_id,
					date_ordered: data.date_ordered,
					order_type: data.order_type,
					notes: data.notes,
					total_cost: data.total_cost
				})
			)
			.returning({ lastInsertedId: salesOrders.id });

		// Prepare sales order item rows: package lines will have product_id = null and package_id set
		const rows = data.products.map((product) => {
			const pidRaw = (product as any).product_id;
			const pkgRaw = (product as any).package_id;
			const pid = pidRaw === '' || pidRaw == null ? null : Number(pidRaw);
			const pkg = pkgRaw === '' || pkgRaw == null ? null : Number(pkgRaw);

			if (!pid && pkg) {
				return Object({
					sales_order_id: order.lastInsertedId,
					product_id: null,
					package_id: pkg,
					quantity: product.quantity,
					unit_price: product.unit_price,
					total_price: product.total_price,
					serial_number: product.serial_number ?? ''
				});
			}

			return Object({
				sales_order_id: order.lastInsertedId,
				product_id: pid,
				package_id: pkg,
				quantity: product.quantity,
				unit_price: product.unit_price,
				total_price: product.total_price,
				serial_number: product.serial_number ?? ''
			});
		});

		await tx.insert(salesOrderItems).values(rows);

		// Fetch current product quantities and package components
		const pds = await tx.select({ id: products.id, quantity: products.quantity }).from(products);
		const pkgComps = await tx
			.select({ package_id: packagesToProducts.package_id, product_id: packagesToProducts.product_id, quantity: packagesToProducts.quantity })
			.from(packagesToProducts);

		// Update product quantities: individual products or package components
		for (const product of data.products) {
			const pidRaw = (product as any).product_id;
			const pkgRaw = (product as any).package_id;
			const pid = pidRaw === '' || pidRaw == null ? null : Number(pidRaw);
			const pkg = pkgRaw === '' || pkgRaw == null ? null : Number(pkgRaw);

			if (pid) {
				const p = pds.find((prod) => prod.id === pid);
				if (!p) {
					throw new Error(`Product with ID ${pid} not found`);
				}
				await tx
					.update(products)
					.set({ quantity: (p.quantity ? p.quantity : 0) - product.quantity })
					.where(eq(products.id, pid));
			} else if (pkg) {
				const comps = pkgComps.filter((c) => c.package_id === pkg);
				await Promise.all(
					comps.map(async (comp) => {
						const p = pds.find((prod) => prod.id === comp.product_id);
						if (!p) {
							throw new Error(`Product with ID ${comp.product_id} not found`);
						}
						const deduct = comp.quantity * product.quantity;
						return await tx
							.update(products)
							.set({ quantity: (p.quantity ? p.quantity : 0) - deduct })
							.where(eq(products.id, comp.product_id));
					})
				);
			}
		}

		return order;
	});
};

export const getSalesOrders = async () => {
	const result = await db
		.select({
			id: salesOrders.id,
			customer_id: salesOrders.customer_id,
			customer_name: customers.name,
			sales_person_name: users.name,
			staff_user_id: salesOrders.staff_user_id,
			date_ordered: salesOrders.date_ordered,
			order_type: salesOrders.order_type,
			order_status: salesOrders.order_status,
			notes: salesOrders.notes,
			total_cost: salesOrders.total_cost,
			item_count: sql<number>`(SELECT COUNT(*) FROM sales_order_items WHERE sales_order_id = ${salesOrders.id})`,
			created_at: salesOrders.created_at
		})
		.from(salesOrders)
		.leftJoin(customers, eq(salesOrders.customer_id, customers.id))
		.leftJoin(users, eq(salesOrders.staff_user_id, users.id))
		.orderBy(desc(salesOrders.created_at));

	return result;
};

export const getSalesOrder = async (id: number) => {
	const order = await db.query.salesOrders.findFirst({
		where: eq(salesOrders.id, id),
		with: {
			customer: { columns: { id: true, name: true } },
			staff: { columns: { id: true, name: true } },
			items: {
				with: {
					product: {
						columns: { id: true, sales_description: true }
					},
					package: {
						columns: { id: true, name: true }
					}
				}
			}
		}
	});

	return order;
};

export const getSalesOrderStats = async () => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const todayISO = today.toISOString();
	const tomorrowISO = tomorrow.toISOString();

	const [stats] = await db
		.select({
			totalSales: sum(salesOrders.total_cost),
			totalOrders: count(),
			todaySales: sql<string>`COALESCE(SUM(CASE WHEN ${salesOrders.created_at} >= ${todayISO}::timestamp AND ${salesOrders.created_at} < ${tomorrowISO}::timestamp THEN ${salesOrders.total_cost} ELSE 0 END), 0)`,
			todayOrders: sql<string>`COALESCE(SUM(CASE WHEN ${salesOrders.created_at} >= ${todayISO}::timestamp AND ${salesOrders.created_at} < ${tomorrowISO}::timestamp THEN 1 ELSE 0 END), 0)`,
			openOrders: sql<string>`COALESCE(SUM(CASE WHEN ${salesOrders.order_status} = 'open' THEN 1 ELSE 0 END), 0)`
		})
		.from(salesOrders);

	const [customerStats] = await db
		.select({
			totalCustomers: count()
		})
		.from(customers);

	return {
		todaySales: parseInt(stats.todaySales ?? '0'),
		todayOrders: parseInt(stats.todayOrders ?? '0'),
		totalSales: parseInt(stats.totalSales ?? '0'),
		totalOrders: stats.totalOrders ?? 0,
		openOrders: parseInt(stats.openOrders ?? '0'),
		totalCustomers: customerStats.totalCustomers ?? 0
	};
};
