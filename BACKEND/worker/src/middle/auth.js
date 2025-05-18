import jwt from '@tsndr/cloudflare-worker-jwt';

/**
 * Hono middleware for authenticating requests.
 * Sets `c.set('jwtPayload', { user })` if authenticated.
 */
export async function authenticate(c, next) {
	// Skip authentication for OPTIONS requests
	if (c.req.method === 'OPTIONS') {
		return await next();
	}

	// Check for API key (admin routes)
	const apiKey = c.req.header('x-api-key');
	if (apiKey && apiKey === c.env.ADMIN_API_KEY) {
		return await next();
	}

	// Check for JWT token
	const authHeader = c.req.header('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.text('Unauthorized', 401);
	}

	const token = authHeader.split(' ')[1];

	try {
		// Verify token
		const isValid = await jwt.verify(token, c.env.JWT_SECRET);
		if (!isValid) {
			return c.text('Invalid token', 401);
		}

		// Get payload
		const { payload } = jwt.decode(token);

		// Check if user exists
		const user = await c.env.AFFILIATES.get(`user:${payload.email}`, 'json');
		if (!user) {
			return c.text('User not found', 401);
		}

		// Attach user payload to context for downstream handlers
		c.set('jwtPayload', { user });
		return await next();
	} catch (error) {
		return c.text('Authentication failed', 401);
	}
}

/**
 * Generate a JWT token for a user.
 */
export async function generateToken(user, env) {
	const payload = {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role || 'affiliate',
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
	};
	return jwt.sign(payload, c.env.JWT_SECRET);
}
