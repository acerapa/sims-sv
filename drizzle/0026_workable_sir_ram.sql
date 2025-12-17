CREATE TABLE "rma_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"rma_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"cost" integer NOT NULL,
	"total_cost" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_merchandise_authorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"date_returned" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_rma_id_return_merchandise_authorizations_id_fk" FOREIGN KEY ("rma_id") REFERENCES "public"."return_merchandise_authorizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_merchandise_authorizations" ADD CONSTRAINT "return_merchandise_authorizations_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;