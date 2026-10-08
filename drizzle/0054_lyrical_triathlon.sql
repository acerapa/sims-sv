ALTER TABLE "fix_assests" RENAME TO "fix_assets";--> statement-breakpoint
ALTER TABLE "fix_assets_items" DROP CONSTRAINT "fix_assets_items_fix_asset_id_fix_assests_id_fk";
--> statement-breakpoint
ALTER TABLE "fix_assets" DROP CONSTRAINT "fix_assests_staff_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fix_assets_items" ADD CONSTRAINT "fix_assets_items_fix_asset_id_fix_assets_id_fk" FOREIGN KEY ("fix_asset_id") REFERENCES "public"."fix_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fix_assets" ADD CONSTRAINT "fix_assets_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;