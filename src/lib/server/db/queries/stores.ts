import { desc } from 'drizzle-orm';
import { db } from '..';
import { stores } from '../schema';

export const getStores = async () => {
	return await db.select().from(stores).orderBy(desc(stores.created_at));
};
