import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import type { Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('session');
	let authenticated = false;
	let sessionData;

	if (session) {
		sessionData = await db.query.sessions.findFirst({
			where: eq(sessions.token, session as string),
			with: {
				user: {
					columns: {
						id: true,
						email: true,
						name: true,
						is_active: true,
						created_at: true,
						role: true
					}
				}
			}
		});
	}

	if (sessionData) {
		// check session expiration
		const now = new Date();
		if (sessionData.expires_at > now) {
			authenticated = true;
		} else {
			// destroy the session in cookies
			event.cookies.delete('session', { path: '/' });
		}
	}

	if (authenticated) {
		event.locals.user = sessionData?.user || null;
		if (event.url.pathname.startsWith('/auth')) {
			// redirect to dashboard
			return new Response('', { status: 302, headers: { Location: '/' } });
		}
	} else {
		if (!event.url.pathname.startsWith('/auth')) {
			// redirect to login page
			return new Response('', { status: 302, headers: { Location: '/auth/login' } });
		}
	}

	return await resolve(event);
};
