import { SafeUser } from '$lib/types/global';
import type { LayoutServerLoad } from './$types';

export interface LayoutData {
	auth_user: SafeUser | null;
}

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		auth_user: locals.user
	} satisfies LayoutData;
};
