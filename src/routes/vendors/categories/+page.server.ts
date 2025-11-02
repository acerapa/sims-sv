import { db } from '$lib/server/db';
import { desc, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import { categories } from '$lib/server/db/schema';
import type { Category } from '$lib/types/global';

export const load: PageServerLoad = async () => {
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

	return {
		categories: categoryTree()
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const body = await request.formData();
			const data: Record<string, string | number | null> = {};

			body.forEach((value, key) => {
				if (key === 'parent_id') {
					data[key] = value ? parseInt(value.toString()) : null;
				} else {
					data[key] = value.toString();
				}
			});

			const categorySchema = z.object({
				name: z.string().min(1, 'Name is required').max(100),
				parent_id: z.number().optional().nullable()
			});

			const { success, error } = categorySchema.safeParse(data);

			if (!success) {
				return fail(400, { message: 'Invalid input', errors: z.treeifyError(error) });
			}

			return await db
				.insert(categories)
				.values(Object(data))
				.returning({ lastInsertedId: categories.id });
		} catch (error) {
			return fail(500, { message: 'Internal Server Error', data: error });
		}
	}
};
