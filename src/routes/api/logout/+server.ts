import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { sessions } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session');
	const session = await db.query.sessions.findFirst({
		where: eq(sessions.token, token as string)
	});

	if (session) {
		const createdAt = new Date(session.created_at);
		const pastDate = new Date(createdAt.setDate(createdAt.getDate() - 1));
		await db.update(sessions).set({ expires_at: pastDate }).where(eq(sessions.id, session.id));
	}

	cookies.delete('session', { path: '/' });

	// return a redirect response
	return new Response(JSON.stringify({ success: true }), {
		status: 302,
		statusText: 'Redirecting...'
	});
};
