import { Hono } from 'hono';
import { generateToken } from '../middleware/auth';
import { validateUserInput } from '../middleware/validator';
import User from '../models/user.model';

const auth = new Hono();

auth.post('/login', async (c) => {
	const { email, password } = await c.req.json();

	const user = await User.getByEmail(c.env, email);
	if (!user) {
		return c.json({ message: 'Invalid credentials' }, 401);
	}

	// In production, use proper password hashing
	if (user.password !== password) {
		return c.json({ message: 'Invalid credentials' }, 401);
	}

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
});

auth.post('/signup', validateUserInput, async (c) => {
	console.log('Request body:', c);
	const { name, email, password } = c.get('validatedJson');
	console.log('Validated JSON:', c.get('validatedJson')); // DEBUG LOG
	const existingUser = await User.getByEmail(c.env, email);
	if (existingUser) {
		return c.json({ message: 'User already exists' }, 400);
	}

	const user = await User.create(c.env, {
		name,
		email,
		password, // Remember to hash in production
		role: 'affiliate',
	});
	console.log('User created:', user); // DEBUG LOG
	const token = await generateToken(user, c.env);

	return c.json(
		{
			success: true,
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		},
		201
	);
});

export default auth;
