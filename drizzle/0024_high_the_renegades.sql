CREATE TABLE "inter_branch_receiving_report_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"ibrr_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"cost" integer NOT NULL,
	"total_cost" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inter_branch_receiving_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"str_id" integer NOT NULL,
	"source_store_id" integer NOT NULL,
	"received_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inter_branch_receiving_report_items" ADD CONSTRAINT "inter_branch_receiving_report_items_ibrr_id_inter_branch_receiving_reports_id_fk" FOREIGN KEY ("ibrr_id") REFERENCES "public"."inter_branch_receiving_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_branch_receiving_report_items" ADD CONSTRAINT "inter_branch_receiving_report_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_branch_receiving_reports" ADD CONSTRAINT "inter_branch_receiving_reports_source_store_id_stores_id_fk" FOREIGN KEY ("source_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;