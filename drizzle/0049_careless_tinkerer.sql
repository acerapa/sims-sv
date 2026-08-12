ALTER TABLE "purchase_order_items" ALTER COLUMN "sale_price" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "total_price" numeric DEFAULT '0';--> statement-breakpoint
ALTER TABLE "packages_to_products" ADD COLUMN "serial_number" varchar;--> statement-breakpoint
ALTER TABLE "packages_to_products" ADD COLUMN "price" numeric DEFAULT '0';--> statement-breakpoint
ALTER TABLE "packages_to_products" ADD COLUMN "total_price" numeric DEFAULT '0';