import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { validateDomainInput } from '../middleware/validator';
import Domain from '../models/domain.model';
import CloudflareService from '../services/cloudfare.service';
const domains = new Hono();

domains.use('*', authenticate);

domains.post('/', validateDomainInput, async (c) => {
	const { user } = c;
	const { partnerName, customDomain } = c.req.valid('json');

	const existing = await Domain.getByPartnerName(c.env, partnerName);
	if (existing) {
		return c.json({ message: 'Partner name already in use' }, 400);
	}

	const domain = await Domain.create(c.env, {
		partnerName,
		customDomain,
		userId: user.id,
	});

	// Provision with Cloudflare
	const cfResponse = await CloudflareService.provisionHostname(c.env, domain);
	if (!cfResponse.success) {
		await Domain.delete(c.env, domain.id);
		return c.json({ message: cfResponse.error }, 500);
	}

	// Update with Cloudflare data
	await Domain.update(c.env, domain.id, {
		cfHostnameId: cfResponse.data.id,
		sslStatus: cfResponse.data.ssl.status,
		status: 'provisioning',
	});

	return c.json(
		{
			success: true,
			domain: domain.subdomain,
			customDomain: domain.customDomain,
			hostname: domain.hostname,
			sslStatus: cfResponse.data.ssl.status,
		},
		201
	);
});

domains.get('/', async (c) => {
	const { user } = c;
	const domains = await Domain.listByUser(c.env, user.id);
	return c.json(domains);
});

domains.get('/:id', async (c) => {
	const { id } = c.req.param();
	const { user } = c;

	const domain = await Domain.getById(c.env, id);
	if (!domain) {
		return c.json({ message: 'Domain not found' }, 404);
	}

	if (domain.userId !== user.id) {
		return c.json({ message: 'Unauthorized' }, 403);
	}

	return c.json(domain);
});

domains.get('/:id/verify', async (c) => {
	const { id } = c.req.param();
	const { user } = c;

	const domain = await Domain.getById(c.env, id);
	if (!domain) {
		return c.json({ message: 'Domain not found' }, 404);
	}

	if (domain.userId !== user.id) {
		return c.json({ message: 'Unauthorized' }, 403);
	}

	if (domain.cfHostnameId) {
		const cfResponse = await CloudflareService.verifyHostname(c.env, domain);
		if (cfResponse.success) {
			const updated = await Domain.update(c.env, domain.id, {
				sslStatus: cfResponse.data.ssl.status,
				status: cfResponse.data.ssl.status === 'active' ? 'active' : domain.status,
			});
			return c.json(updated);
		}
	}

	return c.json(domain);
});

domains.delete('/:id', async (c) => {
	const { id } = c.req.param();
	const { user } = c;

	const domain = await Domain.getById(c.env, id);
	if (!domain) {
		return c.json({ message: 'Domain not found' }, 404);
	}

	if (domain.userId !== user.id) {
		return c.json({ message: 'Unauthorized' }, 403);
	}

	if (domain.cfHostnameId) {
		await CloudflareService.deleteHostname(c.env, domain);
	}

	await Domain.delete(c.env, domain.id);

	return c.json({ success: true });
});

export default domains;
