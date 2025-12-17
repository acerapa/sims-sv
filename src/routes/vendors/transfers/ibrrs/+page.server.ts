import { getIBRRs } from '$lib/server/db/queries/ibrrs';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ depends }) => {
	depends('transfers:ibrrs');
	const ibrrs = await getIBRRs();
	return {
		ibrrs
	};
};

export const actions: Actions = {
	createIBRR: async ({ request }) => {
		const formData = await request.formData();
		const formValues = decode(formData);

		console.log(formValues);
	}
};
