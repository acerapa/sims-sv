import { and, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';
import { UserRoles } from '#lib/const.ts';

export const getAdministrator = async () => {
	const [user] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			is_active: users.is_active,
			created_at: users.created_at
		})
		.from(users)
		.where(and(eq(users.name, 'Administrator'), eq(users.role, UserRoles.ADMIN)))
		.limit(1)
		.execute();

	return user;
};

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
