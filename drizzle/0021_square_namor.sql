ALTER TABLE "stores" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."store_status";