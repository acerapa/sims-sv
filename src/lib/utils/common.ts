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

export function formatCurrency(value: string | number) {
	const num = typeof value === 'string' ? parseFloat(value || '0') : value;
	return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	return function (...args: Parameters<T>) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}
