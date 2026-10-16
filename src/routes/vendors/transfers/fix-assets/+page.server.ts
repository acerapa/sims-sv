import { getFixAssets } from '$lib/server/db/queries/fix-assets';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const fixAssets = await getFixAssets();

	return { fixAssets };
};

export const actions: Actions = {
  submitFixAsset: async ({ request }) => {
    const formData = await request.formData();
    console.log(decode(formData));
    return 'test';
  }
}
