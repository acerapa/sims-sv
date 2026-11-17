import { eq, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { suppliers } from '../schema';

// Supplier distributors for the client's Calbayog-based tech chain — the five curated
// starter rows for the RMA flow (edit names/addresses/contacts below) plus a dynamic
// generator for bulk testing, mirroring the house seeder pattern: identifiable rows
// (FAKE- names), fail-fast on re-seed, and a cleanup mode that deletes only the fake
// rows it created.
//
// Usage: npm run seed:suppliers [count] — count defaults to DEFAULT_SUPPLIER_COUNT and
// is the total number of suppliers this script manages: the curated rows first (for a
// count of 5 or less, only that many curated rows are seeded), then FAKE- generated
// suppliers up to the count. npm run seed:suppliers:cleanup removes only the FAKE- rows.
const FAKE_NAME_PREFIX = 'FAKE-';
const DEFAULT_SUPPLIER_COUNT = 10;

const SEED_SUPPLIERS: {
	name: string;
	address: string;
	contact_person: string;
	email: string;
	phone_number: string;
}[] = [
	{
		name: 'TechSource Distribution PH',
		address: '128 ACCRE BLDG., MAGSAYSAY AVENUE, QUEZON CITY',
		contact_person: 'Miguel Reyes',
		email: 'sales@techsourceph.example.com',
		phone_number: '0917 555 0101'
	},
	{
		name: 'DataLine Trading Corp.',
		address: 'UNIT 4F, RIVERSIDE PLAZA, MAKATI CITY',
		contact_person: 'Anna Lim',
		email: 'orders@datalinetrading.example.com',
		phone_number: '0918 555 0102'
	},
	{
		name: 'ProComp Systems Supply',
		address: 'GROUND FLOOR, IT HUB, CEBU CITY',
		contact_person: 'Carlo Santos',
		email: 'supply@procompsystems.example.com',
		phone_number: '0927 555 0103'
	},
	{
		name: 'NetWave Communications Supply',
		address: 'CORNER OSMEÑA AND GOZON ST., DAVAO CITY',
		contact_person: 'Bella Cruz',
		email: 'b2b@netwavesupply.example.com',
		phone_number: '0916 555 0104'
	},
	{
		name: 'CoreVolt Electronics PH',
		address: '88 R. MUÑOZ AVE., MANILA',
		contact_person: 'Daniel Tan',
		email: 'accounts@corevoltp.example.com',
		phone_number: '0917 555 0105'
	}
];

// name/address/contact parts for generated suppliers — the sequence number in the name
// keeps them unique (suppliers.name is a unique constraint)
const NAME_A = [
	'Tech',
	'Data',
	'Net',
	'Core',
	'Prime',
	'Metro',
	'Pacific',
	'Summit',
	'Delta',
	'Vertex'
];
const NAME_B = ['Line', 'Source', 'Wave', 'Volt', 'Comp', 'Hub', 'Link', 'Grid'];
const NAME_C = ['Distribution', 'Trading', 'Supply', 'Electronics', 'Systems'];
const NAME_D = ['Corp.', 'Inc.', 'PH', 'Enterprises'];
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

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_SUPPLIER_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:suppliers [positive-int]`);
	return count;
};

const makeFakeSupplier = (seq: number) => ({
	name: `${FAKE_NAME_PREFIX}${pick(NAME_A)} ${pick(NAME_B)} ${pick(NAME_C)} ${pick(NAME_D)} ${String(seq).padStart(3, '0')}`,
	address: `${randInt(2, 99)} ${pick(STREETS)}, ${pick(DISTRICTS)}, ${pick(CITIES)}`,
	contact_person: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
	email: `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}${seq}@example.com`,
	phone_number: `09${randInt(16, 99)} 555 ${String(randInt(0, 9999)).padStart(4, '0')}`
});

const cleanupSupplierData = async () => {
	const gone = await db
		.delete(suppliers)
		.where(like(suppliers.name, `${FAKE_NAME_PREFIX}%`))
		.returning({ id: suppliers.id });
	console.log(`Cleaned up — ${gone.length} fake suppliers (curated and real rows untouched)`);
};

const seedSupplierData = async (requestedCount: number) => {
	const [existingFake, maxRow] = await Promise.all([
		db
			.select({ id: suppliers.id })
			.from(suppliers)
			.where(like(suppliers.name, `${FAKE_NAME_PREFIX}%`))
			.limit(1),
		db.select({ max: sql<number>`coalesce(max(${suppliers.id}), 0)` }).from(suppliers)
	]);
	if (existingFake.length > 0) {
		console.log('Fake supplier data already present — run npm run seed:suppliers:cleanup first');
		return;
	}

	// curated rows first, then enough generated suppliers to reach the requested total
	const curatedToSeed = SEED_SUPPLIERS.slice(0, Math.min(requestedCount, SEED_SUPPLIERS.length));
	const fakeNeeded = Math.max(0, requestedCount - curatedToSeed.length);

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const idRange = (max: number, count: number) =>
		Array.from({ length: count }, (_, i) => max + i + 1);
	const ids = idRange(maxRow[0]?.max ?? 0, curatedToSeed.length + fakeNeeded);
	let nextId = 0;
	let created = 0;
	let existing = 0;

	for (const seed of curatedToSeed) {
		const [found] = await db
			.select({ id: suppliers.id })
			.from(suppliers)
			.where(eq(suppliers.name, seed.name))
			.limit(1);
		if (found) {
			existing++;
			continue;
		}
		await db.insert(suppliers).values({ id: ids[nextId++], ...seed });
		created++;
		console.log(`Created supplier: ${seed.name}`);
	}

	for (let i = 0; i < fakeNeeded; i++) {
		await db.insert(suppliers).values({ id: ids[nextId++], ...makeFakeSupplier(i + 1) });
		created++;
	}
	console.log(
		`Suppliers seeded — ${created} created, ${existing} already existed ` +
			`(${curatedToSeed.length} curated, ${fakeNeeded} generated)`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupSupplierData();
		} else {
			await seedSupplierData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in supplier seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
