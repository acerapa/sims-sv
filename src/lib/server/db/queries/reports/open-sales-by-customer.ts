import { and, eq, gte, lte, or } from 'drizzle-orm';
import { db } from '../..';
import { customers, products, salesOrderItems, salesOrders, packages } from '../../schema';
import { SalesOrderStatus } from '$lib/const';

export const getOpenSalesGroupedByCustomer = async (from?: string, to?: string) => {
  const result = await db.select({
    sales_order_id: salesOrders.id,
    customer_name: customers.name,
    total_cost: salesOrders.total_cost,
    date_ordered: salesOrders.date_ordered,
    notes: salesOrders.notes,
    item_name: products.sales_description || packages.name,
    item_quantity: salesOrderItems.quantity,
    item_cost: salesOrderItems.unit_price,
    item_total_price: salesOrderItems.total_price
  })
    .from(salesOrders)
    .leftJoin(customers, eq(salesOrders.customer_id, customers.id))
    .leftJoin(salesOrderItems, eq(salesOrders.id, salesOrderItems.sales_order_id))
    .leftJoin(products, eq(salesOrderItems.product_id, products.id))
    .where(
      and(
        or(
          eq(salesOrders.order_status, SalesOrderStatus.OPEN),
          eq(salesOrders.order_status, SalesOrderStatus.PARTIALLY_INVOICED),
        ),
        from ? gte(salesOrders.date_ordered, new Date(from)) : undefined,
        to ? lte(salesOrders.date_ordered, new Date(to)) : undefined,
      )
    )

  const grouped = Object.groupBy(result, (item) => item?.customer_name || "")

  const summary = Object.entries(grouped).map(([customer, sales]) => {
    return {
      customer,
      sales,
      total: sales?.reduce((acc, sale) => acc + sale.total_cost, 0) || 0,
    };
  })

  const detailed = Object.entries(grouped).map(([customer, sales]) => {
    const groupedItemsBySaleId = sales ? Object.groupBy(sales, (item) => item.sales_order_id) : {};
    const formattedSales = Object.entries(groupedItemsBySaleId).map(([saleId, items]) => {
      return {
        sales_order_id: saleId,
        date_ordered: items?.[0]?.date_ordered,
        items: items?.map(item => ({
          item_name: item.item_name,
          item_quantity: item.item_quantity,
          item_cost: item.item_cost,
          item_total_price: item.item_total_price,
        })) || [],
        total: items?.reduce((acc, sale) => acc + sale.total_cost, 0) || 0,
      };
    });

    return {
      customer,
      sales: formattedSales,
      total: formattedSales?.reduce((acc, sale) => acc + sale.total, 0) || 0,
    };
  });

  return { summary, detailed };
};
