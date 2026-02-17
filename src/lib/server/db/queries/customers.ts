import type { Customer } from '$lib/types/global';
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

export const createCustomer = async (customer: Customer) => {
	return db.insert(customers).values(customer).returning({
		id: customers.id,
		name: customers.name,
		address: customers.address,
		phone: customers.phone,
		viber: customers.viber,
		fb_account: customers.fb_account
	});
};
