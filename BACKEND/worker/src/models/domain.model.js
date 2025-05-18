import { nanoid } from 'nanoid';

export default class Domain {
	static async create(env, { partnerName, customDomain, userId }) {
		const id = nanoid();
		const subdomain = `${partnerName}.traveltool.x`;
		const hostname = customDomain || subdomain;
		const now = new Date().toISOString();

		const domain = {
			id,
			subdomain,
			customDomain,
			hostname,
			userId,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			settings: {
				layout: '1',
				textColor: '#333333',
				backgroundColor: '#ffffff',
			},
		};

		await Promise.all([
			env.DOMAINS.put(id, JSON.stringify(domain)),
			env.DOMAINS.put(`partner:${partnerName}`, id),
			env.DOMAINS.put(`user-domains:${userId}:${id}`, '1'),
			env.DOMAINS.put(`hostname:${hostname}`, id),
		]);

		return domain;
	}

	static async getById(env, id) {
		const data = await env.DOMAINS.get(id, 'json');
		return data || null;
	}

	static async getByPartnerName(env, partnerName) {
		const id = await env.DOMAINS.get(`partner:${partnerName}`);
		if (!id) return null;
		return this.getById(env, id);
	}

	static async listByUser(env, userId) {
		const domainsList = await env.DOMAINS.list({ prefix: `user-domains:${userId}:` });
		const domains = await Promise.all(
			domainsList.keys.map(async ({ name }) => {
				const id = name.split(':').pop();
				return this.getById(env, id);
			})
		);
		return domains.filter(Boolean);
	}

	static async update(env, id, updates) {
		const domain = await this.getById(env, id);
		if (!domain) return null;

		const updated = {
			...domain,
			...updates,
			updatedAt: new Date().toISOString(),
		};

		await env.DOMAINS.put(id, JSON.stringify(updated));
		return updated;
	}

	static async delete(env, id) {
		const domain = await this.getById(env, id);
		if (!domain) return false;

		await Promise.all([
			env.DOMAINS.delete(id),
			env.DOMAINS.delete(`partner:${domain.partnerName}`),
			env.DOMAINS.delete(`user-domains:${domain.userId}:${id}`),
			env.DOMAINS.delete(`hostname:${domain.hostname}`),
		]);

		return true;
	}

	static async listAll(env) {
		const domainsList = await env.DOMAINS.list();
		const domains = await Promise.all(
			domainsList.keys
				.map(async ({ name }) => {
					if (!name.includes(':')) {
						// Skip our index keys
						return this.getById(env, name);
					}
					return null;
				})
				.filter(Boolean)
		);
		return domains.filter(Boolean);
	}

	static async count(env) {
		const list = await env.DOMAINS.list();
		return list.keys.filter((key) => !key.name.includes(':')).length;
	}
}
