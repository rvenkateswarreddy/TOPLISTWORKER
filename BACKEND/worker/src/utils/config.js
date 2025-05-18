export default {
	// Application defaults
	defaults: {
		limit: 10,
		layout: '1',
		textColor: '#333333',
		backgroundColor: '#ffffff',
		cacheTTL: 300, // 5 minutes
	},

	// Allowed values
	toplistTypes: ['charter', 'air', 'last_minute'],
	outputFormats: ['json', 'html', 'email', 'full', 'light', 'image'],
	layoutTypes: ['1', '2'],

	// Cloudflare settings
	cf: {
		ssl: {
			method: 'http',
			type: 'dv',
			settings: {
				http2: 'on',
				tls13: 'on',
				min_tls_version: '1.2',
			},
		},
	},

	// JWT settings
	jwt: {
		expiresIn: '7d',
		algorithm: 'HS256',
	},
};
