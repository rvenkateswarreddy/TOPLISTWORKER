export default {
	async getSettings(c) {
		const { user } = c.get('jwtPayload');
		const hostname = c.req.header('host');

		// Get domain-specific settings
		const domainData = await c.env.DOMAINS.get(`hostname:${hostname}`, 'json');

		if (!domainData) {
			return c.json({ message: 'Domain not found' }, 404);
		}

		// Verify ownership
		if (domainData.userId !== user.id) {
			return c.json({ message: 'Unauthorized' }, 403);
		}

		return c.json(domainData.settings || {});
	},

	async updateSettings(c) {
		const { user } = c.get('jwtPayload');
		const hostname = c.req.header('host');
		const newSettings = await c.req.json();

		// Get domain data
		const domainData = await c.env.DOMAINS.get(`hostname:${hostname}`, 'json');

		if (!domainData) {
			return c.json({ message: 'Domain not found' }, 404);
		}

		// Verify ownership
		if (domainData.userId !== user.id) {
			return c.json({ message: 'Unauthorized' }, 403);
		}

		// Update settings
		domainData.settings = {
			...domainData.settings,
			...newSettings,
		};

		// Save back to KV
		await c.env.DOMAINS.put(`hostname:${hostname}`, JSON.stringify(domainData));

		return c.json({ success: true });
	},
};
