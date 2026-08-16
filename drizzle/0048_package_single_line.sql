-- Migration: allow product_id nullable on sales_order_items and invoice_items; application-level ensures either product_id or package_id
ALTER TABLE sales_order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE invoice_items ALTER COLUMN product_id DROP NOT NULL;

-- (Optional) Add indexes for package_id lookups
CREATE INDEX IF NOT EXISTS idx_sales_order_items_package_id ON sales_order_items(package_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_package_id ON invoice_items(package_id);
