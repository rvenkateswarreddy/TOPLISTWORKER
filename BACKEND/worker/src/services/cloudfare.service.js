export default class CloudflareService {
	static async provisionHostname(env, domain) {
		try {
			const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/custom_hostnames`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.CF_API_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					hostname: domain.hostname,
					ssl: {
						method: 'http',
						type: 'dv',
						settings: {
							http2: 'on',
							tls13: 'on',
							min_tls_version: '1.2',
						},
					},
					custom_origin_server: env.FALLBACK_ORIGIN,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				const error = data.errors?.map((e) => e.message).join(', ') || 'Failed to provision domain';
				return { success: false, error };
			}

			return { success: true, data: data.result };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}

	static async verifyHostname(env, domain) {
		try {
			const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/custom_hostnames/${domain.cfHostnameId}`, {
				headers: {
					Authorization: `Bearer ${env.CF_API_TOKEN}`,
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();

			if (!response.ok) {
				const error = data.errors?.map((e) => e.message).join(', ') || 'Failed to verify domain';
				return { success: false, error };
			}

			return { success: true, data: data.result };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}

	static async deleteHostname(env, domain) {
		try {
			await fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/custom_hostnames/${domain.cfHostnameId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${env.CF_API_TOKEN}`,
					'Content-Type': 'application/json',
				},
			});
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}
}
