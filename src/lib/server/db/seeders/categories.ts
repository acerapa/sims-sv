import { and, eq } from 'drizzle-orm';
import { db, client } from '..';
import { categories } from '../schema';

// Starter categories for the client's tech store (hardware parts + complete machines).
// Flat for now — set parentName to nest a category under another (parents seed first).
const SEED_CATEGORIES: { name: string; parentName?: string }[] = [
	{ name: 'Processors' },
	{ name: 'Motherboards' },
	{ name: 'Memory' },
	{ name: 'Storage' },
	{ name: 'Graphics Cards' },
	{ name: 'Power Supplies' },
	{ name: 'Cooling' },
	{ name: 'Computer Cases' },
	{ name: 'Monitors' },
	{ name: 'Keyboards' },
	{ name: 'Mice' },
	{ name: 'Audio' },
	{ name: 'Networking' },
	{ name: 'Printers' },
	{ name: 'UPS & Power Protection' },
	{ name: 'Accessories & Cables' },
	{ name: 'Laptops' },
	{ name: 'Desktop PCs' }
];

const seedCategories = async () => {
	let created = 0;
	let existing = 0;
	try {
		for (const seed of SEED_CATEGORIES) {
			let parent: { id: number } | undefined;
			if (seed.parentName) {
				const [found] = await db
					.select({ id: categories.id })
					.from(categories)
					.where(eq(categories.name, seed.parentName))
					.limit(1);
				if (!found)
					throw new Error(
						`Cannot create "${seed.name}": parent category "${seed.parentName}" not found`
					);
				parent = found;
			}

			const where = parent
				? and(eq(categories.name, seed.name), eq(categories.parent_id, parent.id))
				: eq(categories.name, seed.name);
			const [found] = await db.select({ id: categories.id }).from(categories).where(where).limit(1);
			if (found) {
				existing++;
				continue;
			}

			await db.insert(categories).values({ name: seed.name, parent_id: parent?.id ?? null });
			created++;
			console.log(`Created category: ${seed.name}`);
		}
		console.log(`Categories seeded — ${created} created, ${existing} already existed`);
	} catch (error) {
		console.error('Error seeding categories:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

seedCategories();
