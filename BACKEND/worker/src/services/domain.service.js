import Domain from '../models/domain.model';
import Toplist from '../models/toplist.model';

export default class DomainService {
	static async getDomainWithSettings(env, hostname) {
		const domain = await Domain.getByHostname(env, hostname);
		if (!domain) return null;

		// Get fresh toplist data to ensure settings are applied
		if (domain.settings) {
			await Toplist.warmCache(env, domain);
		}

		return domain;
	}

	static async updateDomainSettings(env, hostname, updates) {
		const domain = await Domain.getByHostname(env, hostname);
		if (!domain) return null;

		const updated = await Domain.update(env, domain.id, {
			settings: {
				...domain.settings,
				...updates,
			},
		});

		// Warm cache with new settings
		await Toplist.warmCache(env, updated);

		return updated;
	}

	static async listActiveDomains(env) {
		const domains = await Domain.listAll(env);
		return domains.filter((d) => d.status === 'active');
	}
}
