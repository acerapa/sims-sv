ALTER TYPE "public"."role" ADD VALUE 'inventory-manager';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;