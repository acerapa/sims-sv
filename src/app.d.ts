// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SafeUser } from '$lib/types/global';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: SafeUser | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
