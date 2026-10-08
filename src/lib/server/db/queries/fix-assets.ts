import { count, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { fixAssetItems, fixAssets } from '../schema';

export const getFixAssets = async () => {
	return await db
		.select({
			id: fixAssets.id,
			date_transfered: fixAssets.date_transfered,
			notes: fixAssets.notes,
			items_count: count(fixAssetItems.id)
		})
		.from(fixAssets)
		.leftJoin(fixAssetItems, eq(fixAssetItems.fix_asset_id, fixAssets.id))
		.groupBy(fixAssets.id, fixAssets.date_transfered, fixAssets.notes)
		.orderBy(desc(fixAssets.created_at));
};
