import { eq, inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { customers } from '../schema';

// Customers for the customers/clients list and the customer pickers in the sales,
// billing, and invoice flows — the four curated starter clients plus a dynamic
// generator for bulk testing, mirroring the house seeder pattern: identifiable rows
// (FAKE- names), fail-fast on re-seed, and a cleanup mode that deletes only the fake
// rows it created. The walk-in customer and any real/curated rows are never touched.
//
// Usage: npm run seed:customers [count] — count defaults to DEFAULT_CUSTOMER_COUNT and
// is the total number of customers this script manages: the curated clients first
// (for a count of 4 or less, only that many curated clients are seeded), then FAKE-
// generated customers up to the count. npm run seed:customers:cleanup removes only
// the FAKE- rows.
const FAKE_NAME_PREFIX = 'FAKE-';
const DEFAULT_CUSTOMER_COUNT = 10;

const SEED_CUSTOMERS: {
	name: string;
	address: string;
	phone: string;
	viber: string;
	fb_account: string;
}[] = [
	{
		name: 'Blue Harbor Trading',
		address: 'Lot 3, National Highway, Calbayog City',
		phone: '0917 555 0201',
		viber: '0917 555 0201',
		fb_account: 'blueharbortrading'
	},
	{
		name: 'San Roque General Store',
		address: 'Brgy. San Roque, Calbayog City',
		phone: '0918 555 0202',
		viber: '0918 555 0202',
		fb_account: 'sanroquegeneralstore'
	},
	{
		name: 'Calbayog Office Supplies',
		address: 'Magsaysay Ave., Calbayog City',
		phone: '0927 555 0203',
		viber: '0927 555 0203',
		fb_account: 'calbayogofficesupplies'
	},
	{
		name: 'Maria Santos',
		address: 'Poblacion, Calbayog City',
		phone: '0916 555 0204',
		viber: '0916 555 0204',
		fb_account: 'maria.santos'
	}
];

// name parts for generated customers — the sequence number in the name keeps them unique
const FIRST_NAMES = [
	'Marco',
	'Liza',
	'Paolo',
	'Grace',
	'Erick',
	'Mara',
	'Jun',
	'Trisha',
	'Alvin',
	'Karen'
];
const LAST_NAMES = [
	'Garcia',
	'Santos',
	'Reyes',
	'Torres',
	'Villanueva',
	'Domingo',
	'Ocampo',
	'Salazar'
];
const STREETS = [
	'Magsaysay Ave.',
	'Rizal St.',
	'Gen. Luna Ave.',
	'Gozon St.',
	'Aguinaldo Blvd.',
	'National Highway',
	'P. Garcia St.'
];
const DISTRICTS = ['Poblacion', 'Zone 1', 'Zone 4', 'Brgy. 5', 'City Center', 'IT Park'];
const CITIES = [
	'Calbayog City',
	'Tacloban City',
	'Cebu City',
	'Davao City',
	'Iloilo City',
	'Bacolod City',
	'Leyte',
	'Laguna'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_CUSTOMER_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:customers [positive-int]`);
	return count;
};

const idRange = (max: number, count: number): number[] =>
	Array.from({ length: count }, (_, i) => max + i + 1);

const makeFakeCustomer = (seq: number) => {
	const first = pick(FIRST_NAMES);
	const last = pick(LAST_NAMES);
	const phone = `09${randInt(16, 99)} 555 ${String(randInt(0, 9999)).padStart(4, '0')}`;
	return {
		name: `${FAKE_NAME_PREFIX}${first} ${last} ${String(seq).padStart(3, '0')}`,
		address: `${randInt(2, 99)} ${pick(STREETS)}, ${pick(DISTRICTS)}, ${pick(CITIES)}`,
		phone,
		viber: phone,
		fb_account: `${first.toLowerCase()}.${last.toLowerCase()}${seq}`
	};
};

const cleanupCustomerData = async () => {
	const fake = await db
		.select({ id: customers.id })
		.from(customers)
		.where(like(customers.name, `${FAKE_NAME_PREFIX}%`));
	if (fake.length > 0) {
		await db.delete(customers).where(
			inArray(
				customers.id,
				fake.map((row) => row.id)
			)
		);
	}
	console.log(`Cleaned up — ${fake.length} fake customers (curated and real rows untouched)`);
};

const seedCustomerData = async (requestedCount: number) => {
	const [existingFake, maxRow] = await Promise.all([
		db
			.select({ id: customers.id })
			.from(customers)
			.where(like(customers.name, `${FAKE_NAME_PREFIX}%`))
			.limit(1),
		db.select({ max: sql<number>`coalesce(max(${customers.id}), 0)` }).from(customers)
	]);
	if (existingFake.length > 0) {
		console.log('Fake customer data already present — run npm run seed:customers:cleanup first');
		return;
	}

	// curated clients first, then enough generated customers to reach the requested total
	const curatedToSeed = SEED_CUSTOMERS.slice(0, Math.min(requestedCount, SEED_CUSTOMERS.length));
	const fakeNeeded = Math.max(0, requestedCount - curatedToSeed.length);

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const ids = idRange(maxRow[0]?.max ?? 0, curatedToSeed.length + fakeNeeded);
	let nextId = 0;
	let created = 0;
	let existing = 0;

	for (const seed of curatedToSeed) {
		const [found] = await db
			.select({ id: customers.id })
			.from(customers)
			.where(eq(customers.name, seed.name))
			.limit(1);
		if (found) {
			existing++;
			continue;
		}
		await db.insert(customers).values({ id: ids[nextId++], ...seed });
		created++;
		console.log(`Created customer: ${seed.name}`);
	}

	for (let i = 0; i < fakeNeeded; i++) {
		await db.insert(customers).values({ id: ids[nextId++], ...makeFakeCustomer(i + 1) });
		created++;
	}
	console.log(
		`Customers seeded — ${created} created, ${existing} already existed ` +
			`(${curatedToSeed.length} curated, ${fakeNeeded} generated)`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupCustomerData();
		} else {
			await seedCustomerData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in customer seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
