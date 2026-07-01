import { getRMAById } from '$lib/server/db/queries/rmas';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;
	const rma = await getRMAById(Number(id));
	return { rma };
};
