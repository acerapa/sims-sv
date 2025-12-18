import { desc } from 'drizzle-orm';
import { db } from '..';
import { suppliers } from '../schema';

export interface CreateSupplierData {
	name: string;
	contact_person: string;
	address: string;
	email?: string | null;
	phone_number?: string | null;
	telephone_number?: string | null;
	notes?: string | null;
}

export const createSupplier = async (data: CreateSupplierData) => {
	return await db.insert(suppliers).values(Object(data)).returning({
		id: suppliers.id,
		name: suppliers.name,
		email: suppliers.email,
		notes: suppliers.notes,
		address: suppliers.address,
		phone_number: suppliers.phone_number,
		contact_person: suppliers.contact_person,
		telephone_number: suppliers.telephone_number
	});
};

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
