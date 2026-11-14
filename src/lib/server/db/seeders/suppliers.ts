import { eq } from 'drizzle-orm';
import { db, client } from '..';
import { suppliers } from '../schema';

// Supplier distributors for the client's Calbayog-based tech chain — starter rows for the
// RMA flow. Edit names/addresses/contacts here.
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

const seedSuppliers = async () => {
	let created = 0;
	let existing = 0;
	try {
		for (const seed of SEED_SUPPLIERS) {
			const [found] = await db
				.select({ id: suppliers.id })
				.from(suppliers)
				.where(eq(suppliers.name, seed.name))
				.limit(1);
			if (found) {
				existing++;
				continue;
			}

			await db.insert(suppliers).values(seed);
			created++;
			console.log(`Created supplier: ${seed.name}`);
		}
		console.log(`Suppliers seeded — ${created} created, ${existing} already existed`);
	} catch (error) {
		console.error('Error seeding suppliers:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

seedSuppliers();
