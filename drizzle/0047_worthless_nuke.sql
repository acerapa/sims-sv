CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "packages_to_products" (
	"package_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "package_id" integer;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD COLUMN "package_id" integer;--> statement-breakpoint
ALTER TABLE "packages_to_products" ADD CONSTRAINT "packages_to_products_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages_to_products" ADD CONSTRAINT "packages_to_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;