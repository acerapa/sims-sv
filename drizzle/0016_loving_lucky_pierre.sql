CREATE TYPE "public"."physical_inventory_status" AS ENUM('draft', 'finalized');--> statement-breakpoint
CREATE TABLE "physical_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"notes" text,
	"status" "physical_inventory_status" NOT NULL,
	"date_finalized" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "physical_inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"physical_inventory_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"system_count" integer NOT NULL,
	"actual_count" integer NOT NULL,
	"difference" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "physical_inventory" ADD CONSTRAINT "physical_inventory_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_inventory_items" ADD CONSTRAINT "physical_inventory_items_physical_inventory_id_physical_inventory_id_fk" FOREIGN KEY ("physical_inventory_id") REFERENCES "public"."physical_inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_inventory_items" ADD CONSTRAINT "physical_inventory_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;