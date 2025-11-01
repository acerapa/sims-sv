import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcrypt';
import { env } from '$env/dynamic/private';

export type LoginResponse = {
	success: boolean;
	error?: string;
};

export const actions = {
	default: async ({ request, cookies }) => {
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

		if (!user) {
			return fail(400, {
				success: false,
				error: 'Invalid email or password'
			} satisfies LoginResponse);
		}

		const isMatch = await compare(password as string, user.password);

		if (!isMatch) {
			return fail(400, {
				success: false,
				error: 'Invalid email or password'
			} satisfies LoginResponse);
		}

		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Expires at 3 days

		await db
			.insert(sessions)
			.values({
				user_id: user.id,
				token: token,
				expires_at: expiresAt
			})
			.execute();

		console.log(env.NODE_ENV);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 3 * 24 * 60 * 60 // Expires at 3 days
		});

		return {
			success: true
		};
	}
} satisfies Actions;
