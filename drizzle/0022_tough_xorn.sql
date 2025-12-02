CREATE TABLE "stock_transfer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"transfer_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;