CREATE TYPE "public"."sales_channel" AS ENUM('pos', 'manual');--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "sales_channel" "sales_channel";