import { goto } from '$app/navigation';
import { page } from '$app/state';
import { updateSearchParams } from './common';

export function paginatedParamsUpdate(updates: Record<string, string | number | null>): void {
	const query = updateSearchParams(page.url.searchParams.toString(), updates);
	const path = page.url;
	const url = new URL(path.toString());
	url.search = query;

	goto(url);
}
