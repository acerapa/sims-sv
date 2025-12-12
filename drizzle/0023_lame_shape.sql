CREATE TABLE "str_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"str_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"cost" integer NOT NULL,
	"total_cost" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "str_items" ADD CONSTRAINT "str_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "str_items" ADD CONSTRAINT "str_items_str_id_stock_transfer_requests_id_fk" FOREIGN KEY ("str_id") REFERENCES "public"."stock_transfer_requests"("id") ON DELETE no action ON UPDATE no action;