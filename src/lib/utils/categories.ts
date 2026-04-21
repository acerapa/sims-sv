import type { Category } from '$lib/types/global';

export const filterCategories = (categories: Category[], query: string): Category[] => {
	const q = query.trim().toLowerCase();
	if (!q) return categories;

	const byId = new Map(categories.map((c) => [c.id, c]));
	const keep = new Set<number>();

	const addAncestors = (c: Category) => {
		let parent = c.parent_id ? byId.get(c.parent_id) : undefined;
		while (parent) {
			keep.add(parent.id);
			parent = parent.parent_id ? byId.get(parent.parent_id) : undefined;
		}
	};

	for (const c of categories) {
		if (c.name.toLowerCase().includes(q)) {
			keep.add(c.id);
			addAncestors(c);
		}
	}

	return categories.filter((c) => keep.has(c.id));
};

export const groupedCategories = (categories: Category[]) => {
	const categoryTree = () => {
		const tree: Category[] = [...categories.filter((category) => category.parent_id === null)];

		const buildTree = (parent: Category) => {
			const children: Category[] = categories.filter(
				(category) => category.parent_id === parent.id
			);

			parent.sub_categories = children.map((child) => buildTree(child));
			return parent;
		};

		const root = tree.map((category) => buildTree(category));
		return root;
	};

	return categoryTree();
};
