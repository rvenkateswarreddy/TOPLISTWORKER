import { nanoid } from 'nanoid';
import { generateToken } from '../middleware/auth.js';

export default {
	async createDomain(c) {
		const { partnerName, customDomain } = await c.req.json();
		const { user } = c.get('jwtPayload'); // Set by authenticate middleware

		// Validation
		if (!partnerName) {
			return c.json({ message: 'Partner name is required' }, 400);
		}

		// Check if domain already exists
		const existing = await c.env.DOMAINS.get(`partner:${partnerName}`, 'json');
		if (existing) {
			return c.json({ message: 'Partner name already in use' }, 400);
		}

		const domainId = nanoid();
		const subdomain = `${partnerName}.traveltool.x`;
		const hostname = customDomain || subdomain;

		// Store in KV
		const domainData = {
			id: domainId,
			partnerName,
			subdomain,
			customDomain,
			hostname,
			userId: user.id,
			createdAt: new Date().toISOString(),
			status: 'provisioning',
			settings: {
				layout: '1',
				textColor: '#333333',
				backgroundColor: '#ffffff',
			},
		};

		await Promise.all([
			c.env.DOMAINS.put(domainId, JSON.stringify(domainData)),
			c.env.DOMAINS.put(`partner:${partnerName}`, domainId),
			c.env.DOMAINS.put(`user-domains:${user.id}:${domainId}`, '1'),
		]);

		// Provision with Cloudflare API
		const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${c.env.ZONE_ID}/custom_hostnames`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${c.env.CF_API_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				hostname,
				ssl: {
					method: 'http',
					type: 'dv',
					settings: {
						http2: 'on',
						tls13: 'on',
						min_tls_version: '1.2',
					},
				},
				custom_origin_server: c.env.FALLBACK_ORIGIN,
			}),
		});

		const cfData = await cfResponse.json();

		if (!cfResponse.ok) {
			// Clean up if provisioning fails
			await Promise.all([
				c.env.DOMAINS.delete(domainId),
				c.env.DOMAINS.delete(`partner:${partnerName}`),
				c.env.DOMAINS.delete(`user-domains:${user.id}:${domainId}`),
			]);

			const errorMsg = cfData.errors?.map((e) => e.message).join(', ') || 'Failed to provision domain';
			return c.json({ message: errorMsg }, 500);
		}

		// Update with Cloudflare data
		domainData.cfHostnameId = cfData.result?.id;
		domainData.sslStatus = cfData.result?.ssl?.status;
		await c.env.DOMAINS.put(domainId, JSON.stringify(domainData));

		return c.json({
			success: true,
			domain: subdomain,
			customDomain,
			hostname,
			sslStatus: domainData.sslStatus,
		});
	},

	async verifyDomain(c) {
		const { id } = c.req.param();
		const domainData = await c.env.DOMAINS.get(id, 'json');

		if (!domainData) {
			return c.json({ message: 'Domain not found' }, 404);
		}

		// Check SSL status with Cloudflare
		if (domainData.cfHostnameId) {
			const cfResponse = await fetch(
				`https://api.cloudflare.com/client/v4/zones/${c.env.ZONE_ID}/custom_hostnames/${domainData.cfHostnameId}`,
				{
					headers: {
						Authorization: `Bearer ${c.env.CF_API_TOKEN}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (cfResponse.ok) {
				const cfData = await cfResponse.json();
				const sslStatus = cfData.result?.ssl?.status;

				// Update if status changed
				if (domainData.sslStatus !== sslStatus) {
					domainData.sslStatus = sslStatus;
					if (sslStatus === 'active') {
						domainData.status = 'active';
					}
					await c.env.DOMAINS.put(id, JSON.stringify(domainData));
				}

				return c.json({
					status: domainData.status,
					sslStatus,
					hostname: domainData.hostname,
					active: sslStatus === 'active',
				});
			}
		}

		return c.json({
			status: domainData.status,
			sslStatus: domainData.sslStatus,
			hostname: domainData.hostname,
			active: false,
		});
	},

	async listDomains(c) {
		const { user } = c.get('jwtPayload');
		const domainsList = await c.env.DOMAINS.list({ prefix: `user-domains:${user.id}:` });
		const domainIds = domainsList.keys.map((key) => key.name.split(':').pop());
		const domains = await Promise.all(domainIds.map((id) => c.env.DOMAINS.get(id, 'json')));
		return c.json(domains.filter(Boolean));
	},

	async getDomain(c) {
		const { id } = c.req.param();
		const domainData = await c.env.DOMAINS.get(id, 'json');

		if (!domainData) {
			return c.json({ message: 'Domain not found' }, 404);
		}

		return c.json(domainData);
	},

	async deleteDomain(c) {
		const { id } = c.req.param();
		const { user } = c.get('jwtPayload');
		const domainData = await c.env.DOMAINS.get(id, 'json');
		if (!domainData) {
			return c.json({ message: 'Domain not found' }, 404);
		}

		// Verify ownership
		if (domainData.userId !== user.id) {
			return c.json({ message: 'Unauthorized' }, 403);
		}

		// Delete from Cloudflare
		if (domainData.cfHostnameId) {
			await fetch(`https://api.cloudflare.com/client/v4/zones/${c.env.ZONE_ID}/custom_hostnames/${domainData.cfHostnameId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${c.env.CF_API_TOKEN}`,
					'Content-Type': 'application/json',
				},
			});
		}

		// Delete from KV
		await Promise.all([
			c.env.DOMAINS.delete(id),
			c.env.DOMAINS.delete(`partner:${domainData.partnerName}`),
			c.env.DOMAINS.delete(`user-domains:${user.id}:${id}`),
		]);

		return c.json({ success: true });
	},

	async adminListDomains(c) {
		const apiKey = c.req.header('x-api-key');
		if (apiKey !== c.env.ADMIN_API_KEY) {
			return c.text('Unauthorized', 401);
		}
		const domainsList = await c.env.DOMAINS.list();
		const domains = await Promise.all(domainsList.keys.map((key) => c.env.DOMAINS.get(key.name, 'json')));
		return c.json(domains.filter(Boolean));
	},

	async adminGetStats(c) {
		const apiKey = c.req.header('x-api-key');
		if (apiKey !== c.env.ADMIN_API_KEY) {
			return c.text('Unauthorized', 401);
		}

		const [domainsCount, affiliatesCount] = await Promise.all([
			c.env.DOMAINS.list().then((list) => list.keys.length),
			c.env.AFFILIATES.list({ prefix: 'user:' }).then((list) => list.keys.length),
		]);

		return c.json({
			domainsCount,
			affiliatesCount,
			activeDomains: domainsCount, // TODO: Filter by status
		});
	},
};
