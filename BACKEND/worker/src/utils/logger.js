export function createLogger(env) {
	return {
		log: (...args) => {
			if (env.NODE_ENV !== 'test') {
				console.log('[LOG]', ...args);
			}
		},
		info: (...args) => {
			if (env.NODE_ENV !== 'test') {
				console.info('[INFO]', ...args);
			}
		},
		warn: (...args) => {
			console.warn('[WARN]', ...args);
		},
		error: (...args) => {
			console.error('[ERROR]', ...args);
		},
		debug: (...args) => {
			if (env.NODE_ENV === 'development') {
				console.debug('[DEBUG]', ...args);
			}
		},
	};
}

// Middleware logger for Hono
export function loggerMiddleware() {
	return async (c, next) => {
		const start = Date.now();
		await next();
		const duration = Date.now() - start;

		const log = {
			method: c.req.method,
			path: c.req.path,
			status: c.res.status,
			duration: `${duration}ms`,
			ip: c.req.header('cf-connecting-ip'),
			userAgent: c.req.header('user-agent'),
		};

		console.log(`[${log.method}] ${log.path} - ${log.status} (${log.duration})`);
	};
}
