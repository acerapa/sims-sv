import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

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
	}
} satisfies Actions;
