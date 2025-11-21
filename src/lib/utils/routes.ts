export const isRouteActive = (
	route: string,
	currentPath: string,
	isStartsWith: boolean = false
): boolean => {
	return isStartsWith ? currentPath.startsWith(route) : route === currentPath;
};
