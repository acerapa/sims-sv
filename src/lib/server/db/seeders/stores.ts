import { eq } from 'drizzle-orm';
import { db, client } from '..';
import { stores, users } from '../schema';

// Branch stores for the client's Calbayog-based tech chain — starter rows for the
// store-dependent features (STRs, IBRRs). Edit names/addresses/phones here.
const SEED_STORES: { name: string; address: string; phone_number: string }[] = [
	{
		name: 'Calbayog Main Branch',
		address: 'BARTOLOME BLDG., MAGSAYSAY ST. BLVD., BRGY. EAST AWANG POB., CALBAYOG CITY, SAMAR',
		phone_number: '088 880 0001'
	},
	{
		name: 'Rosario Branch',
		address: 'MAGSAYSAY AVENUE, ROSARIO, SAMAR',
		phone_number: '0917 123 4567'
	},
	{
		name: 'Borongay Branch',
		address: 'NATIONAL HIGHWAY, BORONGAY, SAMAR',
		phone_number: '0918 234 5678'
	},
	{
		name: 'Guiuan Branch',
		address: 'J. DELA CRUZ ST., GUIUAN, SAMAR',
		phone_number: '0927 345 6789'
	}
];

const seedStores = async () => {
	let created = 0;
	let existing = 0;
	try {
		// every store row needs a manager (NOT NULL FK) — reuse the earliest user (the
		// seeded admin is id 1) rather than creating new accounts
		const [manager] = await db
			.select({ id: users.id, name: users.name })
			.from(users)
			.orderBy(users.id)
			.limit(1);
		if (!manager) throw new Error('No users found — run npm run seed:admin-user first');

		for (const seed of SEED_STORES) {
			const [found] = await db
				.select({ id: stores.id })
				.from(stores)
				.where(eq(stores.name, seed.name))
				.limit(1);
			if (found) {
				existing++;
				continue;
			}

			await db.insert(stores).values({ ...seed, manager: manager.id });
			created++;
			console.log(`Created store: ${seed.name}`);
		}
		console.log(
			`Stores seeded — ${created} created, ${existing} already existed (manager: ${manager.name})`
		);
	} catch (error) {
		console.error('Error seeding stores:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

seedStores();
