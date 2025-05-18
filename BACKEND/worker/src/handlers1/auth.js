import { generateToken } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

export default {
	// Hono-style login handler
	async login(c) {
		try {
			const { email, password } = await c.req.json();

			// Get user from KV
			const user = await c.env.AFFILIATES.get(`user:${email}`, 'json');
			if (!user) {
				return c.json({ message: 'Invalid credentials' }, 401);
			}

			// Verify password (in production, use proper hashing)
			if (user.password !== password) {
				return c.json({ message: 'Invalid credentials' }, 401);
			}

			// Generate token
			const token = await generateToken(user, c.env);

			return c.json({
				success: true,
				token,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		} catch (err) {
			return c.json({ message: 'Internal Server Error', error: err.message }, 500);
		}
	},

	// Hono-style signup handler
	async signup(c) {
		try {
			const { name, email, password } = await c.req.json();
			// Validate input
			if (!name || !email || !password) {
				return c.json({ message: 'All fields are required' }, 400);
			}

			// Check if user exists
			const existingUser = await c.env.AFFILIATES.get(`user:${email}`, 'json');
			if (existingUser) {
				return c.json({ message: 'User already exists' }, 400);
			}

			// Create user (in production, hash the password)
			const user = {
				id: nanoid(),
				name,
				email,
				password, // REMEMBER: In production, hash this!
				role: 'affiliate',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Save to KV
			await c.env.AFFILIATES.put(`user:${email}`, JSON.stringify(user));

			// Generate token
			const token = await generateToken(user, c.env);

			return c.json({
				success: true,
				token,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		} catch (err) {
			return c.json({ message: 'Internal Server Error', error: err.message }, 500);
		}
	},
};
