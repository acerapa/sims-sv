CREATE TYPE "public"."bill_status" AS ENUM('partial', 'paid');--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"bill_date" timestamp NOT NULL,
	"bill_status" "bill_status" NOT NULL,
	"due_date" timestamp NOT NULL,
	"total_amount" numeric NOT NULL,
	"paid_amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_purchase_order_id_purhase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purhase_order"("id") ON DELETE no action ON UPDATE no action;