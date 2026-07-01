export function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString('default', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}
