export async function cors(c, next) {
	// c is Hono's Context
	// c.req.raw is native Request
	// set headers on c.header()
	const req = c.req.raw;
	const origin = req.headers.get('origin');
	if (origin) {
		c.header('Access-Control-Allow-Origin', origin);
		c.header('Vary', 'Origin');
	} else {
		c.header('Access-Control-Allow-Origin', '*');
	}
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
	c.header('Access-Control-Allow-Credentials', 'true');
	if (req.method === 'OPTIONS') {
		return c.body(null, 204);
	}
	await next();
}
