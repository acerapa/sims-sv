CREATE TYPE "public"."receive_type" AS ENUM('with_pay', 'without_pay');--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"cost" numeric NOT NULL,
	"total_cost" numeric NOT NULL,
	"purchase_order_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purhase_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar NOT NULL,
	"supplier_id" integer NOT NULL,
	"receive_date" timestamp NOT NULL,
	"receive_type" "receive_type" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purhase_order_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purhase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purhase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purhase_order" ADD CONSTRAINT "purhase_order_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;