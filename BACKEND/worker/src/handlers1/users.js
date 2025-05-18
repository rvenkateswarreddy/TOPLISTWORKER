import { generateToken } from '../middleware/auth';

export default {
	async getCurrentUser(request, env) {
		const { user } = request;

		// Remove sensitive data
		const userData = { ...user };
		delete userData.password;
		delete userData.tokens;

		return new Response(JSON.stringify(userData), {
			headers: { 'Content-Type': 'application/json' },
		});
	},

	async updateCurrentUser(request, env) {
		const { user } = request;
		const updates = await request.json();

		// Don't allow updating certain fields
		delete updates.id;
		delete updates.email;
		delete updates.role;

		// Update user
		const updatedUser = {
			...user,
			...updates,
			updatedAt: new Date().toISOString(),
		};

		// Save back to KV
		await env.AFFILIATES.put(`user:${user.email}`, JSON.stringify(updatedUser));

		// Generate new token with updated info
		const token = await generateToken(updatedUser, env);

		return new Response(
			JSON.stringify({
				success: true,
				token,
				user: updatedUser,
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			}
		);
	},
};
