import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import { categories } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	return {
		categories: await db.execute(sql`
        WITH RECURSIVE category_tree AS (
          SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL
          UNION ALL
          SELECT c.id, c.name, c.parent_id FROM categories c JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT * FROM category_tree
    `)
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
				name: z.string().min(2).max(100),
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
