import { createInvoice, createPayment, type CreateInvoiceData, type CreatePaymentData } from "./invoices";
import { createSalesOrder, getSalesOrder, type CreateSalesOrder } from "./sales-orders";

export interface CreateDailySalesData extends CreateSalesOrder {
  payment_amount: number,
  payment_type: string,
  payment_notes?: string,
}

export const createDailySales = async (dailySalesData: CreateDailySalesData) => {
  const res = await createSalesOrder(dailySalesData);
  const recentSalesOrder = await getSalesOrder(res.lastInsertedId)

  if(recentSalesOrder) {
    const createInvoiceData: CreateInvoiceData = {
      sales_order_id: res.lastInsertedId,
      invoice_date: dailySalesData.date_ordered,
      due_date: dailySalesData.date_ordered,
      notes: dailySalesData.notes,
      total_amount: recentSalesOrder.total_cost,
      items: recentSalesOrder.items.map((item) => {
        return {
          sales_order_item_id: item.id,
          product_id: item.product_id,
          package_id: item.package_id,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price || '0'),
          total_price: parseFloat(item.total_price || '0')
        }
      }),
    };

    const invoice = await createInvoice(createInvoiceData);

    const createPaymentData = {
      invoice_id: invoice.lastInsertedId,
      payment_date: dailySalesData.date_ordered,
      amount: dailySalesData.payment_amount,
      notes: dailySalesData.payment_notes,
      payment_type: dailySalesData.payment_type
    } as CreatePaymentData;

    await createPayment(createPaymentData);
  }
}
