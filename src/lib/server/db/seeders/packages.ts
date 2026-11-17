import { asc, eq, inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { categories, packages, packagesToProducts, products } from '../schema';

// Package bundles for the vendors/packages list, print, and sales-order flows — the
// curated starter bundles (resolved against real products in the curated categories
// from categories.ts) plus a dynamic generator for bulk testing, mirroring the house
// seeder pattern: identifiable rows (FAKE- names), fail-fast on missing deps and
// re-seed, and a cleanup mode that deletes only the fake rows it created. Real
// products are reused — no fake products are created.
//
// Usage: npm run seed:packages [count] — count defaults to DEFAULT_PACKAGE_COUNT and
// is the total number of packages this script manages: the curated bundles first
// (for a count of 4 or less, only that many curated bundles are seeded), then FAKE-
// generated bundles up to the count. npm run seed:packages:cleanup removes only the
// FAKE- rows.
const FAKE_NAME_PREFIX = 'FAKE-';
const DEFAULT_PACKAGE_COUNT = 10;
const MIN_PRODUCTS_PER_PACKAGE = 2;
const MAX_PRODUCTS_PER_PACKAGE = 6;

// one product per category makes up a bundle — category names are the curated rows
// from the categories seeder, so these resolve in any seeded environment
const SEED_PACKAGES: { name: string; description: string; categoryNames: string[] }[] = [
	{
		name: 'Office Desktop PC',
		description: 'Office build: processor, motherboard, memory, storage, power supply and case.',
		categoryNames: [
			'Processors',
			'Motherboards',
			'Memory',
			'Storage',
			'Power Supplies',
			'Computer Cases'
		]
	},
	{
		name: 'Gaming Desktop PC',
		description: 'Gaming build: adds a graphics card and cooling to the standard office parts.',
		categoryNames: [
			'Processors',
			'Motherboards',
			'Memory',
			'Storage',
			'Graphics Cards',
			'Cooling',
			'Power Supplies',
			'Computer Cases'
		]
	},
	{
		name: 'Media Editing Workstation',
		description: 'Media build: office parts plus cooling and audio for capture and editing.',
		categoryNames: [
			'Processors',
			'Motherboards',
			'Memory',
			'Storage',
			'Cooling',
			'Audio',
			'Power Supplies',
			'Computer Cases'
		]
	},
	{
		name: 'Starter Peripheral Set',
		description: 'Monitor, keyboard and mouse bundle to pair with any new build.',
		categoryNames: ['Monitors', 'Keyboards', 'Mice']
	}
];

// name parts for generated bundles — the sequence number in the name keeps them unique
const NAME_A = ['Budget', 'Gamer', 'Office', 'Creator', 'Media', 'Starter', 'Pro'];
const NAME_B = ['PC', 'Build', 'Bundle', 'Kit', 'Station'];
const FAKE_DESCRIPTIONS = [
	'Bundle of assorted hardware for quick checkout',
	'Pre-assembled unit with matched parts',
	'Customer-requested combination from current stock',
	'Clearance bundle of end-of-line items'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_PACKAGE_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:packages [positive-int]`);
	return count;
};

const idRange = (max: number, count: number): number[] =>
	Array.from({ length: count }, (_, i) => max + i + 1);

const makeFakePackage = (seq: number) => ({
	name: `${FAKE_NAME_PREFIX}${pick(NAME_A)} ${pick(NAME_B)} ${String(seq).padStart(3, '0')}`,
	description: pick(FAKE_DESCRIPTIONS)
});

interface ProductRow {
	id: number;
	sale_price: string;
}

// pick the first real product (lowest id) from each category so curated bundles are
// deterministic across re-seeds
const resolveCuratedPackages = async () => {
	const productRows = await db
		.select({ id: products.id, sale_price: products.sale_price, category: categories.name })
		.from(products)
		.innerJoin(categories, eq(products.category_id, categories.id))
		.orderBy(asc(products.id));

	const productsByCategory = new Map<string, ProductRow[]>();
	for (const row of productRows) {
		const rows = productsByCategory.get(row.category) ?? [];
		rows.push({ id: row.id, sale_price: row.sale_price ?? '0' });
		productsByCategory.set(row.category, rows);
	}

	const resolved: { name: string; description: string; items: ProductRow[] }[] = [];
	for (const def of SEED_PACKAGES) {
		const items = def.categoryNames.map((category) => {
			const candidates = productsByCategory.get(category);
			if (!candidates || candidates.length === 0)
				throw new Error(
					`Cannot create package "${def.name}": no product found in category "${category}" — ` +
						`add a product to it or run npm run seed:fake-data or seed:str first`
				);
			return candidates[0];
		});
		resolved.push({ name: def.name, description: def.description, items });
	}
	return resolved;
};

const insertPackageWithProducts = async (data: {
	id: number;
	name: string;
	description: string;
	products: ProductRow[];
}) => {
	// row price/total come from the product's sale price (qty 1 each), and the package
	// total is the sum — same shape the package form submits
	const totalPrice = data.products.reduce((sum, row) => sum + Number(row.sale_price), 0);
	await db.insert(packages).values({
		id: data.id,
		name: data.name,
		description: data.description,
		total_price: String(totalPrice)
	});
	await db.insert(packagesToProducts).values(
		data.products.map((row) => ({
			package_id: data.id,
			product_id: row.id,
			quantity: 1,
			price: row.sale_price,
			total_price: row.sale_price
		}))
	);
};

const pickDistinctProducts = (all: ProductRow[], count: number): ProductRow[] => {
	const chosen: ProductRow[] = [];
	const chosenIds = new Set<number>();
	while (chosen.length < count) {
		const product = pick(all);
		if (chosenIds.has(product.id)) continue;
		chosenIds.add(product.id);
		chosen.push(product);
	}
	return chosen;
};

const cleanupPackageData = async () => {
	const fakePackages = await db
		.select({ id: packages.id })
		.from(packages)
		.where(like(packages.name, `${FAKE_NAME_PREFIX}%`));
	const fakeIds = fakePackages.map((row) => row.id);
	if (fakeIds.length > 0) {
		// join rows first — they hold the foreign keys to the package rows
		await db.delete(packagesToProducts).where(inArray(packagesToProducts.package_id, fakeIds));
		await db.delete(packages).where(inArray(packages.id, fakeIds));
	}
	console.log(`Cleaned up — ${fakeIds.length} fake packages (curated and real rows untouched)`);
};

const seedPackageData = async (requestedCount: number) => {
	const [rawProducts, existingFake, maxRow] = await Promise.all([
		db
			.select({ id: products.id, sale_price: products.sale_price })
			.from(products)
			.orderBy(asc(products.id)),
		db
			.select({ id: packages.id })
			.from(packages)
			.where(like(packages.name, `${FAKE_NAME_PREFIX}%`))
			.limit(1),
		db.select({ max: sql<number>`coalesce(max(${packages.id}), 0)` }).from(packages)
	]);
	// sale_price is a nullable column with a '0' default — treat DB nulls as zero
	const productRows: ProductRow[] = rawProducts.map((row) => ({
		id: row.id,
		sale_price: row.sale_price ?? '0'
	}));
	if (productRows.length === 0)
		throw new Error('No products found — run npm run seed:fake-data or seed:str first');
	if (existingFake.length > 0) {
		console.log('Fake package data already present — run npm run seed:packages:cleanup first');
		return;
	}

	const curated = await resolveCuratedPackages();

	// curated bundles first, then enough generated packages to reach the requested total
	const curatedToSeed = curated.slice(0, Math.min(requestedCount, curated.length));
	const fakeNeeded = Math.max(0, requestedCount - curatedToSeed.length);

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const ids = idRange(maxRow[0]?.max ?? 0, curatedToSeed.length + fakeNeeded);
	let nextId = 0;
	let created = 0;
	let existing = 0;

	for (const def of curatedToSeed) {
		const [found] = await db
			.select({ id: packages.id })
			.from(packages)
			.where(eq(packages.name, def.name))
			.limit(1);
		if (found) {
			existing++;
			continue;
		}
		await insertPackageWithProducts({
			id: ids[nextId++],
			name: def.name,
			description: def.description,
			products: def.items
		});
		created++;
		console.log(`Created package: ${def.name}`);
	}

	for (let i = 0; i < fakeNeeded; i++) {
		const fake = makeFakePackage(i + 1);
		await insertPackageWithProducts({
			id: ids[nextId++],
			name: fake.name,
			description: fake.description,
			products: pickDistinctProducts(
				productRows,
				randInt(MIN_PRODUCTS_PER_PACKAGE, MAX_PRODUCTS_PER_PACKAGE)
			)
		});
		created++;
	}
	console.log(
		`Packages seeded — ${created} created, ${existing} already existed ` +
			`(${curatedToSeed.length} curated, ${fakeNeeded} generated)`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupPackageData();
		} else {
			await seedPackageData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in package seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
