import { createSalesOrder, type CreateSalesOrder } from "./sales-orders";

export const createDailySales = async (salesOrder: CreateSalesOrder) => {
  const res = await createSalesOrder(salesOrder);
  console.log(res.lastInsertedId);
  return res;
}
