export const readStoredJson = <Value>(key: string) => {
	if (typeof window === 'undefined') return null;

	try {
		const rawValue = window.localStorage.getItem(key);
		if (!rawValue) return null;
		return JSON.parse(rawValue) as Value;
	} catch {
		return null;
	}
};

export const writeStoredJson = (key: string, value: unknown) => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
};
