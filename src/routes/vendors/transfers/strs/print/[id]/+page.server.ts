import { getStrById } from '$lib/server/db/queries/strs';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;
	const str = await getStrById(Number(id));
	return { str };
};
