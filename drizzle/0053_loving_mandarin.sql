CREATE TABLE "fix_assets_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"fix_asset_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"serial_number" varchar,
	"quantity" integer NOT NULL,
	"cost" integer NOT NULL,
	"total_cost" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fix_assests" (
	"id" serial PRIMARY KEY NOT NULL,
	"date_transfered" timestamp NOT NULL,
	"notes" text,
	"staff_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fix_assets_items" ADD CONSTRAINT "fix_assets_items_fix_asset_id_fix_assests_id_fk" FOREIGN KEY ("fix_asset_id") REFERENCES "public"."fix_assests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fix_assets_items" ADD CONSTRAINT "fix_assets_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fix_assests" ADD CONSTRAINT "fix_assests_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;