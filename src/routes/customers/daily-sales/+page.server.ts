import { getProducts } from "$lib/server/db/queries/products";
import { SvelteURLSearchParams } from "svelte/reactivity";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const search = new SvelteURLSearchParams(url.searchParams);
  const query = search.get('search') ?? '';

  let products;
  if (query) {
    products = await getProducts(query);
  }

  return { products: products ?? [] };
}
