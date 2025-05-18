import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { validateSettingsInput } from '../middleware/validator';
import Domain from '../models/domain.model';

const settings = new Hono();

settings.use('*', authenticate);

settings.get('/', async (c) => {
	const { user } = c;
	const hostname = c.req.header('host');

	const domain = await Domain.getByHostname(c.env, hostname);
	if (!domain) {
		return c.json({ message: 'Domain not found' }, 404);
	}

	if (domain.userId !== user.id) {
		return c.json({ message: 'Unauthorized' }, 403);
	}

	return c.json(domain.settings || {});
});

settings.put('/', validateSettingsInput, async (c) => {
	const { user } = c;
	const hostname = c.req.header('host');
	const updates = c.req.valid('json');

	const domain = await Domain.getByHostname(c.env, hostname);
	if (!domain) {
		return c.json({ message: 'Domain not found' }, 404);
	}

	if (domain.userId !== user.id) {
		return c.json({ message: 'Unauthorized' }, 403);
	}

	const updated = await Domain.update(c.env, domain.id, {
		settings: {
			...domain.settings,
			...updates,
		},
	});

	return c.json(updated.settings);
});

export default settings;
