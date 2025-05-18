import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { validateUserUpdateInput } from '../middleware/validator';
import User from '../models/user.model';

const users = new Hono();

users.use('*', authenticate);

users.get('/me', async (c) => {
	const { user } = c;

	// Return user without sensitive data
	const { password, ...userData } = user;
	return c.json(userData);
});

users.put('/me', validateUserUpdateInput, async (c) => {
	const { user } = c;
	const updates = c.req.valid('json');

	// Don't allow updating certain fields
	delete updates.id;
	delete updates.email;
	delete updates.role;

	const updatedUser = await User.update(c.env, user.email, updates);

	// Return without sensitive data
	const { password, ...userData } = updatedUser;
	return c.json(userData);
});

export default users;
