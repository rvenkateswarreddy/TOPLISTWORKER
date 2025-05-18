import jwt from '@tsndr/cloudflare-worker-jwt';
import User from '../models/user.model';

export async function authenticate(c, next) {
	// Skip for OPTIONS and public routes
	if (c.req.method === 'OPTIONS' || c.req.path.startsWith('/api/auth')) {
		return next();
	}

	const authHeader = c.req.header('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json({ message: 'Unauthorized' }, 401);
	}

	const token = authHeader.split(' ')[1];

	try {
		console.log('JWT_SECRET:', c.env.JWT_SECRET, typeof c.env.JWT_SECRET); // DEBUG LOG
		const isValid = await jwt.verify(token, c.env.JWT_SECRET);
		if (!isValid) {
			return c.json({ message: 'Invalid token' }, 401);
		}

		const { payload } = jwt.decode(token);
		const user = await User.getByEmail(c.env, payload.email);

		if (!user) {
			return c.json({ message: 'User not found' }, 401);
		}

		c.set('user', user);
		return next();
	} catch (error) {
		return c.json({ message: 'Authentication failed' }, 401);
	}
}

export async function authenticateAdmin(c, next) {
	const apiKey = c.req.header('X-API-Key');
	if (apiKey !== c.env.ADMIN_API_KEY) {
		return c.json({ message: 'Unauthorized' }, 401);
	}
	return next();
}

export async function generateToken(user, env) {
	const payload = {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role || 'affiliate',
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
	};

	console.log('JWT_SECRET:', env.JWT_SECRET, typeof env.JWT_SECRET); // DEBUG LOG

	return jwt.sign(payload, env.JWT_SECRET);
}
