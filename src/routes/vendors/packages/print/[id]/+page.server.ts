import { error } from '@sveltejs/kit';
import { getPackage } from '$lib/server/db/queries/packages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) {
		error(404, 'Package not found');
	}

	const pkg = await getPackage(id);
	if (!pkg) {
		error(404, 'Package not found');
	}

	return { pkg };
};
