import { and, eq, gte, or } from 'drizzle-orm';
import { db } from '../..';
import { customers, salesOrderItems, salesOrders } from '../../schema';
import { SalesOrderStatus } from '$lib/const';

export const getOpenSalesGroupedByCustomer = async (from?: string, to?: string) => {
  const result = await db.select({
    sales_order_id: salesOrders.id,
    customer_name: customers.name,
    total_cost: salesOrders.total_cost,
    date_ordered: salesOrders.date_ordered,
    notes: salesOrders.notes,
  })
    .from(salesOrders)
    .leftJoin(salesOrderItems, eq(salesOrders.id, salesOrderItems.sales_order_id))
    .leftJoin(customers, eq(salesOrders.customer_id, customers.id))
    .where(
      and(
        or(
          eq(salesOrders.order_status, SalesOrderStatus.OPEN),
          eq(salesOrders.order_status, SalesOrderStatus.PARTIALLY_INVOICED),
        ),
        from ? gte(salesOrders.date_ordered, new Date(from)) : undefined,
        to ? gte(salesOrders.date_ordered, new Date(to)) : undefined,
      )
    )

  const grouped = Object.groupBy(result, (item) => item?.customer_name || "")

  return Object.entries(grouped).map(([customer, sales]) => {
    return {
      customer,
      sales,
      total: sales?.reduce((acc, sale) => acc + sale.total_cost, 0) || 0,
    };
  });
};
