ALTER TABLE "products" RENAME COLUMN "selling_bracked_id" TO "selling_bracket_id";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_selling_bracked_id_selling_brackets_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_selling_bracket_id_selling_brackets_id_fk" FOREIGN KEY ("selling_bracket_id") REFERENCES "public"."selling_brackets"("id") ON DELETE no action ON UPDATE no action;