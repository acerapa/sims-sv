import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export type LoginResponse = {
	success: boolean;
	error?: string;
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email || !password) {
			return fail(400, {
				success: false,
				error: 'Email and password are required'
			} satisfies LoginResponse);
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email as string)
		});

		console.log(user);
		if (!user) {
			return fail(400, {
				success: false,
				error: 'Invalid email or password'
			} satisfies LoginResponse);
		}
	}
} satisfies Actions;
