import { db } from '..';
import { sellingBrackets } from '../schema';

export const getSellingBrackets = async () => {
	return await db.select().from(sellingBrackets);
};
