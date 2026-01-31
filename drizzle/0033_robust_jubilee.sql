ALTER TABLE "products" ALTER COLUMN "cost" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sale_price" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sale_price" DROP NOT NULL;