CREATE TYPE "public"."store_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"manager" integer NOT NULL,
	"address" varchar NOT NULL,
	"status" "store_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_manager_users_id_fk" FOREIGN KEY ("manager") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;