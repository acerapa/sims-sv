export function getRoleLabel(role: string) {
	switch (role) {
		case 'admin':
			return 'Administrator';
		case 'cashier':
			return 'Cashier';
		case 'inventory-manager':
			return 'Inventory Manager';
		default:
			return 'Unknown';
	}
}
