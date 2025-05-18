import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import errorHandler from './middleware/error';
import authRoutes from './controllers/auth.controller';
import domainRoutes from './controllers/domains.controller';
import settingsRoutes from './controllers/settings.controller';
import toplistRoutes from './controllers/toplist.controller';
import userRoutes from './controllers/users.controller';
import adminRoutes from './controllers/admin.controller';
import { RateLimiter } from './rate-limiter';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
	'*',
	cors({
		origin: ['*.traveltool.x', 'traveltool.x'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
		credentials: true,
	})
);

// Health check
app.get('/health', (c) => {
	c.json({ status: 'OK' });
});
app.get('/', (c) => c.json({ message: 'Hello wrangler!' }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/domains', domainRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/toplist', toplistRoutes);
app.route('/api/users', userRoutes);
app.route('/admin', adminRoutes);

// Error handling
app.onError(errorHandler);

export { RateLimiter };
export default app;
