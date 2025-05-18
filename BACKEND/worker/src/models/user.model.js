import { nanoid } from 'nanoid';

export default class User {
	static async create(env, { name, email, password, role = 'affiliate' }) {
		const user = {
			id: nanoid(),
			name,
			email,
			password, // Remember to hash in production!
			role,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await env.AFFILIATES.put(`user:${email}`, JSON.stringify(user));
		return user;
	}

	static async getByEmail(env, email) {
		const data = await env.AFFILIATES.get(`user:${email}`, 'json');
		return data || null;
	}

	static async update(env, email, updates) {
		const user = await this.getByEmail(env, email);
		if (!user) return null;

		const updated = {
			...user,
			...updates,
			updatedAt: new Date().toISOString(),
		};

		await env.AFFILIATES.put(`user:${email}`, JSON.stringify(updated));
		return updated;
	}

	static async count(env) {
		const list = await env.AFFILIATES.list({ prefix: 'user:' });
		return list.keys.length;
	}
}
