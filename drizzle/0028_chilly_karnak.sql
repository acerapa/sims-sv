CREATE TYPE "public"."sales_order_status" AS ENUM('open', 'cancelled', 'invoiced');--> statement-breakpoint
CREATE TYPE "public"."sales_order_type" AS ENUM('onetime', 'installment');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"address" text NOT NULL,
	"phone" varchar,
	"viber" varchar,
	"fb_account" varchar
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"staff_user_id" integer NOT NULL,
	"date_ordered" timestamp NOT NULL,
	"order_type" "sales_order_type" DEFAULT 'onetime',
	"order_status" "sales_order_status" DEFAULT 'open',
	"notes" text,
	"total_cost" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;