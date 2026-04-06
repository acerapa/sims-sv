import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';

export const getUsers = async () => {
	return await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			is_active: users.is_active,
			created_at: users.created_at
		})
		.from(users)
		.orderBy(desc(users.created_at))
		.execute();
};

export const getManagerUsers = async () => {
	return await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			is_active: users.is_active,
			created_at: users.created_at
		})
		.from(users)
		.where(eq(users.role, 'inventory-manager'))
		.orderBy(desc(users.created_at))
		.execute();
};
