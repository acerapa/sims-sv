ALTER TABLE "invoice_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ALTER COLUMN "product_id" DROP NOT NULL;