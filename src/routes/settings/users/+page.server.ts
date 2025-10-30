import type { Actions, PageServerLoad } from './$types';
import * as z from 'zod';
import type { User } from '$lib/types/global';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hash } from 'bcrypt';

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const data = Object.fromEntries(await request.formData()) as Partial<User>;
			data.is_active = data.is_active?.toString().toLocaleLowerCase() === 'true' ? true : false;

			const userFormSchema = z.object({
				name: z.string('Must be a string').min(1, 'Name is required'),
				email: z.email('Invalid email'),
				password: z
					.string('Must be a string')
					.min(8, 'Password must be at least 8 characters long'),
				role: z.enum(['admin', 'cashier', 'inventory-manager'], 'Must be a valid role'),
				is_active: z.boolean().default(true).optional()
			});

			const { success, error } = userFormSchema.safeParse(data);

			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			const saltRound = 10;
			const password = data.password || '';
			const hashedPassword = await hash(password, saltRound);

			data.password = hashedPassword;

			return await db.insert(users).values(Object(data)).returning({ lastInsertedId: users.id });
		} catch (error) {
			return fail(500, {
				message: 'Internal Server Error',
				errors: (error as Error).message
			});
		}
	}
};

export const load: PageServerLoad = async ({ depends }) => {
	depends('settings:users');

	return {
		users: await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				is_active: users.is_active,
				created_at: users.created_at
			})
			.from(users)
			.execute()
	};
};
