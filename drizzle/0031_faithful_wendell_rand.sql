ALTER TABLE "products" DROP CONSTRAINT "products_preferred_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "preferred_supplier_id";