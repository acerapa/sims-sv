import { desc } from 'drizzle-orm';
import { categories } from '../schema';
import { db } from '..';

export const getCategories = async () => {
	return await db.select().from(categories).orderBy(desc(categories.id));
};
