import { getIBRRById } from '$lib/server/db/queries/ibrrs';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;
	const ibrr = await getIBRRById(Number(id));
	return { ibrr };
};
