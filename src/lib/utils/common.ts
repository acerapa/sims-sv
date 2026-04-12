import z from 'zod';

export function getRoleLabel(role: string) {
	return role.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function findErrorByKey(
	issues: z.core.$ZodIssue[] | undefined,
	key: string
): z.core.$ZodIssue[] | undefined {
	if (!issues) return undefined;
	return issues.filter((issue) => issue.path[0] === key);
}
