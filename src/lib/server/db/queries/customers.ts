import { WalkInCustomerName } from '#lib/const.ts';
import type { Customer } from '#lib/types/global.ts';
import { asc, count, eq } from 'drizzle-orm';
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

export const getPaginatedCustomers = async (page: number, limit: number) => {
	const offset = (page - 1) * limit;

	const [{ total }] = await db.select({ total: count() }).from(customers);

	const data = await db
		.select({
			id: customers.id,
			name: customers.name,
			address: customers.address,
			phone: customers.phone,
			viber: customers.viber,
			fb_account: customers.fb_account
		})
		.from(customers)
		.orderBy(asc(customers.name)) // stable order so pages don't shuffle
		.offset(offset)
		.limit(limit);

	return {
		data,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
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

export const getWalkInCustomer = async () => {
	return db
		.select({ id: customers.id })
		.from(customers)
		.where(eq(customers.name, WalkInCustomerName));
};
