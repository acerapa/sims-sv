ALTER TABLE "products" ADD COLUMN "barcode" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_barcode_unique" UNIQUE("barcode");