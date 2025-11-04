import type { Category } from '$lib/types/global';

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
