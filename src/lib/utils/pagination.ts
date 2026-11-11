import { goto } from '$app/navigation';
import { page } from '$app/state';
import { updateSearchParams } from './common';

export function tableParamsUpdate(
	searchParams: string,
	updates: Record<string, string | number | null>
): void {
	const query = updateSearchParams(searchParams, updates);
	const url = new URL(page.url);
	url.search = query;

	// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() can't take a query string in this Kit version
	goto(url);
}
