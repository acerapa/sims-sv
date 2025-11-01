import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	console.log('Logout action triggered');
	// TODO: Implement logout logic
	// Remove the session in cookies
	// Invalidate the session record
	return new Response(JSON.stringify({ success: true }), { status: 200 });
};
