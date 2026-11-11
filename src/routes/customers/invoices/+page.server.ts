import { getInvoices } from '#lib/server/db/queries/invoices.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const invoices = await getInvoices();
	return { invoices };
};
