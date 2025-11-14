CREATE TYPE "public"."bill_payment_type" AS ENUM('cash', 'check');--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "payment_type" "bill_payment_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "check_number" varchar;