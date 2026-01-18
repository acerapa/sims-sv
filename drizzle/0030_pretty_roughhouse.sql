CREATE TABLE "selling_brackets" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_price" integer NOT NULL,
	"end_price" integer NOT NULL,
	"discount_percentage" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
