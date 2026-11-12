import { UserRoles } from '#lib/const.ts';
import { hash } from 'bcrypt';
import { getAdministrator } from '../queries/users';
import { users } from '../schema';
import { db, client } from '..';

const insertAdminitrator = async () => {
	try {
    const user = await getAdministrator();
		if (user) {
			console.log('Administrator account already exists!');
      console.log('No actions needed.');
			return
		}

		const hashedPassword = await hash('password', 10);

		await db.insert(users).values({
			name: 'Administrator',
			email: 'admin@email.com',
			role: UserRoles.ADMIN,
			password: hashedPassword
		});
	} catch (error) {
		console.error('Something went wrong!');
		console.error(error);
	} finally {
		await client.end();
	}
};

insertAdminitrator();
