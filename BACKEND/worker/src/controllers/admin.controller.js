import { Hono } from 'hono';
import { authenticateAdmin } from '../middleware/auth';
import Domain from '../models/domain.model';

const admin = new Hono();

admin.use('*', authenticateAdmin);

admin.get('/domains', async (c) => {
	const domains = await Domain.listAll(c.env);
	return c.json(domains);
});

admin.get('/stats', async (c) => {
	const [domainsCount, affiliatesCount] = await Promise.all([Domain.count(c.env), User.count(c.env)]);

	return c.json({
		domainsCount,
		affiliatesCount,
		activeDomains: domainsCount, // Filter by status in production
	});
});

export default admin;
