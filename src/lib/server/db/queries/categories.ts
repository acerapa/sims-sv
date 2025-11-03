import { desc } from 'drizzle-orm';
import { categories } from '../schema';
import { db } from '..';
import type { Category } from '$lib/types/global';

export const getCategories = async () => {
	const allCategories = await db.select().from(categories).orderBy(desc(categories.id));

	const categoryTree = () => {
		const tree: Category[] = [...allCategories.filter((category) => category.parent_id === null)];

		const buildTree = (parent: Category) => {
			const children: Category[] = allCategories.filter(
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
