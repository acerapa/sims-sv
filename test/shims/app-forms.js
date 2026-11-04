/**
 * Test shim for `$app/forms` — mirrors SvelteKit's server `fail()`:
 * throw an ActionFailure that the framework would turn into a failed action result.
 */
export class ActionFailure extends Error {
	status;
	data;

	/** @param {number} status @param {Record<string, unknown>} data */
	constructor(status, data) {
		super(`ActionFailure: ${status}`);
		this.name = 'ActionFailure';
		this.status = status;
		this.data = data;
	}
}

/** @param {number} status @param {Record<string, unknown>} data */
export function fail(status, data) {
	throw new ActionFailure(status, data);
}
