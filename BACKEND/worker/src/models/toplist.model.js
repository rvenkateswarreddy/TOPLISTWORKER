export default class Toplist {
	static async getData(env, { type, limit, destinationThemeId, cityCodeDep }) {
		const cacheKey = this.getCacheKey(type, limit, destinationThemeId, cityCodeDep);

		// Check cache first
		const cached = await env.TOP_LIST_CACHE.get(cacheKey, 'json');
		if (cached) {
			return cached;
		}

		// Build API URL
		let apiUrl = `${env.API_BASE_URL}/widget/toplist/${type}?output=json&limit=${limit}`;
		if (destinationThemeId) apiUrl += `&destination_theme_id=${destinationThemeId}`;
		if (cityCodeDep) apiUrl += `&city_code_dep=${cityCodeDep}`;
		apiUrl += `&_=${Date.now()}`; // Cache buster

		// Fetch from origin API
		const response = await fetch(apiUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch toplist: ${response.status}`);
		}

		const data = await response.json();

		// Cache the response
		await env.TOP_LIST_CACHE.put(cacheKey, JSON.stringify(data), {
			expirationTtl: env.CACHE_TTL || 300,
		});

		return data;
	}

	static getCacheKey(type, limit, destinationThemeId, cityCodeDep) {
		return `toplist:${type}:${limit}:${destinationThemeId || ''}:${cityCodeDep || ''}`;
	}

	static async warmCache(env, domain) {
		if (!domain.settings) return;

		const cacheKey = this.getCacheKey('charter', 10, domain.settings.destinationThemeId, domain.settings.cityCodeDep);

		try {
			const data = await this.getData(env, {
				type: 'charter',
				limit: 10,
				destinationThemeId: domain.settings.destinationThemeId,
				cityCodeDep: domain.settings.cityCodeDep,
			});
			return data;
		} catch (error) {
			console.error('Cache warming failed:', error);
			return null;
		}
	}
}
