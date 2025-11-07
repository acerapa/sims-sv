import { desc } from 'drizzle-orm';
import { db } from '..';
import { suppliers } from '../schema';

export const getSuppliers = async () => {
	return await db
		.select({
			id: suppliers.id,
			name: suppliers.name,
			email: suppliers.email,
			notes: suppliers.notes,
			address: suppliers.address,
			phone_number: suppliers.phone_number,
			contact_person: suppliers.contact_person,
			telephone_number: suppliers.telephone_number
		})
		.from(suppliers)
		.orderBy(desc(suppliers.created_at))
		.execute();
};

// export const getProductSuppliers = async () => {
//   return await db.query.products.findMany({
//     where
//   })
// }
