import { db } from '..';
import { customers } from '../schema';

export const getCustomers = async () => {
	return db
		.select({
			id: customers.id,
			name: customers.name,
			address: customers.address,
			phone: customers.phone,
			viber: customers.viber,
			fb_account: customers.fb_account
		})
		.from(customers);
};
