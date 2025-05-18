import { Hono } from 'hono';
import { z } from 'zod';

export const validateUserInput = async (c, next) => {
	const schema = z.object({
		name: z.string().min(2),
		email: z.string().email(),
		password: z.string().min(8),
	});
	try {
		const data = await c.req.json();
		const validated = schema.parse(data);
		console.log('validated', validated);
		c.set('validatedJson', validated); // <- store it
		await next();
	} catch (error) {
		return c.json({ message: 'Validation failed', errors: error.errors }, 400);
	}
};

export const validateDomainInput = new Hono().post(async (c, next) => {
	const schema = z.object({
		partnerName: z
			.string()
			.min(3)
			.max(30)
			.regex(/^[a-z0-9-]+$/),
		customDomain: z
			.string()
			.regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/)
			.optional(),
	});

	try {
		const data = await c.req.json();
		const validated = schema.parse(data);
		c.req.valid('json', validated);
		return next();
	} catch (error) {
		return c.json(
			{
				message: 'Validation failed',
				errors: error.errors,
			},
			400
		);
	}
});
export const validateSettingsInput = new Hono().put(async (c, next) => {
	const schema = z.object({
		layout: z.enum(['1', '2']).optional(),
		textColor: z
			.string()
			.regex(/^#([0-9a-f]{3}){1,2}$/i)
			.optional(),
		backgroundColor: z
			.string()
			.regex(/^#([0-9a-f]{3}){1,2}$/i)
			.optional(),
		cityCodeDep: z.string().max(10).optional(),
		destinationThemeId: z.string().max(10).optional(),
	});

	try {
		const data = await c.req.json();
		const validated = schema.parse(data);
		c.req.valid('json', validated);
		return next();
	} catch (error) {
		return c.json(
			{
				message: 'Validation failed',
				errors: error.errors,
			},
			400
		);
	}
});

export const validateUserUpdateInput = new Hono().put(async (c, next) => {
	const schema = z.object({
		name: z.string().min(2).optional(),
		company: z.string().max(100).optional(),
		phone: z.string().max(20).optional(),
	});

	try {
		const data = await c.req.json();
		const validated = schema.parse(data);
		c.req.valid('json', validated);
		return next();
	} catch (error) {
		return c.json(
			{
				message: 'Validation failed',
				errors: error.errors,
			},
			400
		);
	}
});
export const validateToplistInput = new Hono().get(async (c, next) => {
	const schema = z.object({
		type: z.enum(['city', 'theme']),
		limit: z.number().min(1).max(50).optional(),
		destinationThemeId: z.string().optional(),
		cityCodeDep: z.string().optional(),
		outputFormat: z.enum(['json', 'xml']).optional(),
	});

	try {
		const data = await c.req.query();
		const validated = schema.parse(data);
		c.req.valid('query', validated);
		return next();
	} catch (error) {
		return c.json(
			{
				message: 'Validation failed',
				errors: error.errors,
			},
			400
		);
	}
});
